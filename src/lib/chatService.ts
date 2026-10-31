import { supabase } from '@/integrations/supabase/client';

export interface ChatMessage {
  id: string;
  sender_type: 'customer' | 'owner';
  message: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  customer_name: string;
  subject: string;
  status: 'open' | 'closed' | 'resolved';
  last_message_at: string;
  last_message_preview: string;
  messages: ChatMessage[];
}

const STORAGE_KEY_PREFIX = 'snapcart_conversations';
const ADMIN_STORAGE_KEY = `${STORAGE_KEY_PREFIX}:admin`;
const CHANNEL_NAME = 'snapcart_chat_channel';

// Create a BroadcastChannel for instant cross-tab communication
let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
  }
} catch (e) {
  console.warn('BroadcastChannel not available:', e);
}

const getStorageKey = (customerUserId?: string, isAdmin = false) =>
  isAdmin ? ADMIN_STORAGE_KEY : `${STORAGE_KEY_PREFIX}:customer:${customerUserId || 'anonymous'}`;

export const getStoredConversations = async (
  forceRemote = false,
  customerUserId?: string,
  isAdmin = false
): Promise<Conversation[]> => {
  // Never expose a shared fallback conversation. Customers must be identified
  // before a conversation can be loaded from either cache or the database.
  if (!isAdmin && !customerUserId) return [];

  const storageKey = getStorageKey(customerUserId, isAdmin);

  if (isAdmin) {
    const { data: dbConversations, error: conversationsError } = await supabase
      .from('conversations')
      .select('*')
      .order('last_message_at', { ascending: false });
    if (conversationsError) throw conversationsError;

    const conversations: Conversation[] = [];
    for (const conv of dbConversations || []) {
      const { data: dbMessages, error: messagesError } = await supabase
        .from('conversation_messages')
        .select('*')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: true });
      if (messagesError) throw messagesError;

      conversations.push({
        id: conv.id,
        customer_name: conv.customer_name || 'Customer',
        subject: conv.subject || 'Order Support',
        status: (conv.status || 'open') as Conversation['status'],
        last_message_at: conv.last_message_at || conv.created_at,
        last_message_preview: conv.last_message_preview || '',
        messages: (dbMessages || []).map((message) => ({
          id: message.id,
          sender_type: message.sender_type as ChatMessage['sender_type'],
          message: message.message,
          created_at: message.created_at,
        })),
      });
    }
    localStorage.setItem(storageKey, JSON.stringify(conversations));
    return conversations;
  }

  // 1. Return fast local storage cache unless explicit forceRemote is set
  if (!forceRemote) {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Failed to parse conversations from storage:', e);
    }
  }

  // 2. Fetch live data from Supabase DB only when forced or on missing cache
  try {
    let conversationsQuery = supabase
      .from('conversations')
      .select('*')
      .order('last_message_at', { ascending: false });

    if (!isAdmin) {
      conversationsQuery = conversationsQuery.eq('customer_user_id', customerUserId);
    }

    const { data: dbConvs, error: convErr } = await conversationsQuery;

    if (convErr) throw convErr;

    if (dbConvs && dbConvs.length > 0) {
      const fullConversations: Conversation[] = [];

      for (const conv of dbConvs) {
        const { data: dbMsgs, error: messagesError } = await supabase
          .from('conversation_messages')
          .select('*')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: true });
        if (messagesError) throw messagesError;

        fullConversations.push({
          id: conv.id,
          customer_name: conv.customer_name || 'Customer',
          subject: conv.subject || 'Order Support',
          status: conv.status || 'open',
          last_message_at: conv.last_message_at || conv.created_at,
          last_message_preview: conv.last_message_preview || '',
          messages: (dbMsgs || []).map((m: any) => ({
            id: m.id,
            sender_type: m.sender_type,
            message: m.message,
            created_at: m.created_at,
          })),
        });
      }

      // Sync to local cache
      localStorage.setItem(storageKey, JSON.stringify(fullConversations));
      return fullConversations;
    }
  } catch (e) {
    console.error('Unable to load chat conversations from Supabase:', e);
    if (forceRemote) throw e;
  }

  // 3. Fallback cache check if remote fetch returned nothing
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {}

  return [];
};

export const saveConversationsLocally = (
  convs: Conversation[],
  customerUserId?: string,
  isAdmin = false
) => {
  try {
    const storageKey = getStorageKey(customerUserId, isAdmin);
    localStorage.setItem(storageKey, JSON.stringify(convs));
    window.dispatchEvent(new Event('snapcart_chat_updated'));
    if (broadcastChannel) {
      broadcastChannel.postMessage({ type: 'CHAT_UPDATED' });
    }
  } catch (e) {
    console.warn('Failed to save conversations:', e);
  }
};

export const subscribeToChatUpdates = (callback: () => void) => {
  const handleEvent = () => callback();
  const handleStorageEvent = (event: StorageEvent) => {
    if (event.key?.startsWith(`${STORAGE_KEY_PREFIX}:`)) callback();
  };

  window.addEventListener('snapcart_chat_updated', handleEvent);
  window.addEventListener('storage', handleStorageEvent);

  if (broadcastChannel) {
    broadcastChannel.onmessage = (event) => {
      if (event.data?.type === 'CHAT_UPDATED') {
        callback();
      }
    };
  }

  // Realtime subscription to Supabase DB tables
  const supabaseChannel = supabase
    .channel('snapcart_realtime_chat')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'conversation_messages' }, () => {
      callback();
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
      callback();
    })
    .subscribe();

  return () => {
    window.removeEventListener('snapcart_chat_updated', handleEvent);
    window.removeEventListener('storage', handleStorageEvent);
    if (supabaseChannel) supabase.removeChannel(supabaseChannel);
  };
};

export const appendMessage = async (
  convId: string,
  senderType: 'customer' | 'owner',
  messageText: string,
  customerName = 'Customer',
  customerUserId?: string
) => {
  const isCustomerMessage = senderType === 'customer';

  if (!isCustomerMessage) {
    const text = messageText.trim();
    if (!text) throw new Error('Reply message cannot be empty.');

    const { data, error: messageError } = await supabase
      .from('conversation_messages')
      .insert({
        conversation_id: convId,
        sender_type: 'owner',
        message: text,
      })
      .select()
      .single();
    if (messageError) throw messageError;

    const { error: conversationError } = await supabase
      .from('conversations')
      .update({
        last_message_at: data.created_at,
        last_message_preview: text,
      })
      .eq('id', convId);
    if (conversationError) throw conversationError;

    return {
      id: data.id,
      customer_name: customerName,
      subject: 'Support Inquiry',
      status: 'open' as const,
      last_message_at: data.created_at,
      last_message_preview: text,
      messages: [{
        id: data.id,
        sender_type: 'owner' as const,
        message: text,
        created_at: data.created_at,
      }],
    };
  }

  const convs = await getStoredConversations(false, customerUserId, !isCustomerMessage);
  if (isCustomerMessage && !customerUserId) {
    throw new Error('You must be signed in to start a support chat.');
  }
  const now = new Date().toISOString();

  const newMsg: ChatMessage = {
    id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    sender_type: senderType,
    message: messageText,
    created_at: now,
  };

  let target = convs.find((c) => c.id === convId);
  if (!target) {
    target = {
      id: convId,
      customer_name: customerName,
      subject: 'Support Inquiry',
      status: 'open',
      last_message_at: now,
      last_message_preview: messageText,
      messages: [],
    };
    convs.unshift(target);
  }

  target.messages.push(newMsg);
  target.last_message_at = now;
  target.last_message_preview = messageText;
  if (customerName !== 'Customer') {
    target.customer_name = customerName;
  }

  // Direct Supabase DB insert (creates conversation row first if missing)
  try {
    let supabaseConvId = convId;
    if (convId.startsWith('conv_')) {
      // Create or fetch Supabase conversation row
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('customer_user_id', customerUserId)
        .limit(1)
        .maybeSingle();

      if (existingConv?.id) {
        supabaseConvId = existingConv.id;
      } else {
        const { data: createdConv, error: createError } = await supabase
          .from('conversations')
          .insert({
            customer_user_id: customerUserId,
            customer_name: customerName,
            subject: 'Order Support Inquiry',
            status: 'open',
            last_message_at: now,
            last_message_preview: messageText,
          })
          .select('id')
          .single();
        if (createError) throw createError;

        if (createdConv?.id) {
          supabaseConvId = createdConv.id;
        }
      }
    }

    if (supabaseConvId && !supabaseConvId.startsWith('conv_')) {
      const { error: messageError } = await supabase.from('conversation_messages').insert({
        conversation_id: supabaseConvId,
        sender_type: senderType,
        message: messageText,
      });
      if (messageError) throw messageError;

      const { error: updateError } = await supabase
        .from('conversations')
        .update({
          ...(isCustomerMessage ? { customer_name: customerName } : {}),
          last_message_at: now,
          last_message_preview: messageText,
        })
        .eq('id', supabaseConvId);
      if (updateError) throw updateError;
    }
  } catch (e) {
    console.error('Unable to send chat message to Supabase:', e);
    throw e;
  }

  saveConversationsLocally(convs, customerUserId, !isCustomerMessage);
  return target;
};
