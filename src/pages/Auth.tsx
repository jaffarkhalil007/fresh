// import { useState } from 'react';
// import { SignIn, SignUp } from '@clerk/clerk-react';
// import { motion, AnimatePresence } from 'framer-motion';
// // @ts-ignore
// import Header from '@/components/layout/Header';
// import Footer from '@/components/layout/Footer';

// const Auth = () => {
//   const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  
//   return (
//     <div className="min-h-screen bg-[#fffdfc] relative selection:bg-[#e3f0ea] flex flex-col">
//       <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#e3f0ea_0%,_transparent_42%)] opacity-50 pointer-events-none" />
//       <Header />

//       <main className="flex-1 flex flex-col items-center justify-center px-4 pb-16 pt-28 sm:pt-32 md:pb-20 md:pt-52 relative z-10">
//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           className="w-full max-w-lg"
//         >
//           <div className="relative w-full p-1 sm:p-3">
//             <div className="relative z-10 mb-6 text-center sm:mb-8">
//               <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#186049]">Welcome to HAMAASH</p>
//               <h1 className="font-serif text-3xl text-[#242024] sm:text-4xl">
//                 {activeTab === 'login' ? 'Sign in to continue' : 'Create your account'}
//               </h1>
//               <p className="mt-2 text-xs leading-relaxed text-[#716b70] sm:text-sm">
//                 {activeTab === 'login' ? 'Keep your everyday edit close.' : 'Join us for a more personal shopping experience.'}
//               </p>
//             </div>
            
//             {/* Tabs */}
//             <div className="relative z-10 mb-6 flex border-b border-[#e8e3e5] sm:mb-8">
//               <button
//                 className={`flex-1 pb-4 text-sm font-medium transition-colors relative ${
//                   activeTab === 'login' ? 'text-[#186049]' : 'text-[#9a9298] hover:text-[#242024]'
//                 }`}
//                 onClick={() => setActiveTab('login')}
//               >
//                 Sign In
//                 {activeTab === 'login' && (
//                   <motion.div layoutId="authTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#186049]" />
//                 )}
//               </button>
//               <button
//                 className={`flex-1 pb-4 text-sm font-medium transition-colors relative ${
//                   activeTab === 'signup' ? 'text-[#186049]' : 'text-[#9a9298] hover:text-[#242024]'
//                 }`}
//                 onClick={() => setActiveTab('signup')}
//               >
//                 Create Account
//                 {activeTab === 'signup' && (
//                   <motion.div layoutId="authTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#186049]" />
//                 )}
//               </button>
//             </div>

//             <div className="relative z-10">
//               <AnimatePresence mode="wait">
//                 {activeTab === 'login' ? (
//                   <motion.div
//                     key="login"
//                     initial={{ opacity: 0, x: -20 }}
//                     animate={{ opacity: 1, x: 0 }}
//                     exit={{ opacity: 0, x: 20 }}
//                     className="flex justify-center"
//                   >
//                     <SignIn 
//                       routing="hash" 
//                       appearance={{
//                         elements: {
//                           rootBox: "w-full",
//                           card: "w-full rounded-2xl border border-[#e8e3e5] bg-white p-5 shadow-[0_18px_45px_rgba(83,52,62,0.12)] sm:p-7",
//                           headerTitle: "hidden",
//                           headerSubtitle: "hidden",
//                           formButtonPrimary: "w-full h-12 text-base mt-2 normal-case rounded-full bg-[#186049] hover:bg-[#0f3d2c] text-white shadow-md",
//                           formFieldInput: "bg-[#fffdfc] border-[#d8cfd3] rounded-xl h-12 px-4 text-[#242024] focus:border-[#186049] focus:ring-1 focus:ring-[#186049]/30",
//                           formFieldLabel: "text-[10px] uppercase tracking-widest font-bold text-[#716b70] mb-2",
//                           footerActionText: "text-[#716b70]",
//                           footerActionLink: "text-[#186049] hover:text-[#0f3d2c] font-medium",
//                           dividerLine: "bg-[#e8e3e5]",
//                           dividerText: "text-[#9a9298] text-[10px] uppercase tracking-widest bg-white",
//                           socialButtonsBlockButton: "bg-white border-[#d8cfd3] hover:bg-[#f8f1f2] text-[#242024] h-12 rounded-xl",
//                           socialButtonsBlockButtonText: "font-medium text-sm text-[#4e484d]",
//                           identityPreviewText: "text-[#242024]",
//                           identityPreviewEditButtonIcon: "text-[#186049]",
//                           formFieldInputShowPasswordButton: "text-[#9a9298] hover:text-[#242024]",
//                         }
//                       }}
//                     />
//                   </motion.div>
//                 ) : (
//                   <motion.div
//                     key="signup"
//                     initial={{ opacity: 0, x: -20 }}
//                     animate={{ opacity: 1, x: 0 }}
//                     exit={{ opacity: 0, x: 20 }}
//                     className="flex justify-center"
//                   >
//                     <SignUp 
//                       routing="hash" 
//                       appearance={{
//                         elements: {
//                           rootBox: "w-full",
//                           card: "w-full rounded-2xl border border-[#e8e3e5] bg-white p-5 shadow-[0_18px_45px_rgba(83,52,62,0.12)] sm:p-7",
//                           headerTitle: "hidden",
//                           headerSubtitle: "hidden",
//                           formButtonPrimary: "w-full h-12 text-base mt-2 normal-case rounded-full bg-[#186049] hover:bg-[#0f3d2c] text-white shadow-md",
//                           formFieldInput: "bg-[#fffdfc] border-[#d8cfd3] rounded-xl h-12 px-4 text-[#242024] focus:border-[#186049] focus:ring-1 focus:ring-[#186049]/30",
//                           formFieldLabel: "text-[10px] uppercase tracking-widest font-bold text-[#716b70] mb-2",
//                           footerActionText: "text-[#716b70]",
//                           footerActionLink: "text-[#186049] hover:text-[#0f3d2c] font-medium",
//                           dividerLine: "bg-[#e8e3e5]",
//                           dividerText: "text-[#9a9298] text-[10px] uppercase tracking-widest bg-white",
//                           socialButtonsBlockButton: "bg-white border-[#d8cfd3] hover:bg-[#f8f1f2] text-[#242024] h-12 rounded-xl",
//                           socialButtonsBlockButtonText: "font-medium text-sm text-[#4e484d]",
//                           identityPreviewText: "text-[#242024]",
//                           identityPreviewEditButtonIcon: "text-[#186049]",
//                           formFieldInputShowPasswordButton: "text-[#9a9298] hover:text-[#242024]",
//                         }
//                       }}
//                     />
//                   </motion.div>
//                 )}
//               </AnimatePresence>
//             </div>
//           </div>
//         </motion.div>
//       </main>
      
//       <Footer />
//     </div>
//   );
// };

// export default Auth;

import { useState } from 'react';
import { SignIn, SignUp } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'framer-motion';
// @ts-ignore
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const Auth = () => {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');

  return (
    <div className="min-h-screen bg-[#fffdfc] relative selection:bg-[#e3f0ea] flex flex-col">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#e3f0ea_0%,_transparent_42%)] opacity-50 pointer-events-none" />

      <Header />

      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-16 pt-28 sm:pt-32 md:pb-20 md:pt-52 relative z-10">
        
        {/* Main Auth Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto flex w-full max-w-lg justify-center"
        >
          <div className="relative mx-auto w-full p-1 sm:p-3">

            {/* Heading */}
            <div className="relative z-10 mb-6 text-center sm:mb-8">
                            <h1 className="font-serif text-3xl text-[#242024] sm:text-4xl">
                {activeTab === 'login'
                  ? 'Sign in to continue'
                  : 'Create your account'}
              </h1>

              {/* <p className="mt-2 text-xs leading-relaxed text-[#716b70] sm:text-sm">
                {activeTab === 'login'
                  ? 'Keep your everyday edit close.'
                  : 'Join us for a more personal shopping experience.'}
              </p> */}
            </div>

            {/* Tabs */}
            <div className="relative z-10 mb-6 flex border-b border-[#e8e3e5] sm:mb-8">
              
              {/* Sign In Tab */}
              <button
                className={`relative flex-1 pb-4 text-sm font-medium transition-colors ${
                  activeTab === 'login'
                    ? 'text-[#186049]'
                    : 'text-[#9a9298] hover:text-[#242024]'
                }`}
                onClick={() => setActiveTab('login')}
              >
                Sign In

                {activeTab === 'login' && (
                  <motion.div
                    layoutId="authTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#186049]"
                  />
                )}
              </button>

              {/* Create Account Tab */}
              <button
                className={`relative flex-1 pb-4 text-sm font-medium transition-colors ${
                  activeTab === 'signup'
                    ? 'text-[#186049]'
                    : 'text-[#9a9298] hover:text-[#242024]'
                }`}
                onClick={() => setActiveTab('signup')}
              >
                Create Account

                {activeTab === 'signup' && (
                  <motion.div
                    layoutId="authTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#186049]"
                  />
                )}
              </button>
            </div>

            {/* Clerk Authentication */}
            <div className="relative z-10 w-full">
              <AnimatePresence mode="wait">

                {/* SIGN IN */}
                {activeTab === 'login' ? (
                  <motion.div
                    key="login"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex w-full justify-center"
                  >
                    <SignIn
                      routing="hash"
                      appearance={{
                        elements: {
                          rootBox: 'mx-auto flex w-full justify-center',

                          card: 'mx-auto w-full rounded-2xl border border-[#e8e3e5] bg-white p-5 shadow-[0_18px_45px_rgba(83,52,62,0.12)] sm:p-7',

                          headerTitle: 'hidden',
                          headerSubtitle: 'hidden',

                          formButtonPrimary:
                            'w-full h-12 text-base mt-2 normal-case rounded-full bg-[#186049] hover:bg-[#0f3d2c] text-white shadow-md',

                          formFieldInput:
                            'bg-[#fffdfc] border-[#d8cfd3] rounded-xl h-12 px-4 text-[#242024] focus:border-[#186049] focus:ring-1 focus:ring-[#186049]/30',

                          formFieldLabel:
                            'text-[10px] uppercase tracking-widest font-bold text-[#716b70] mb-2',

                          footerActionText:
                            'text-[#716b70]',

                          footerActionLink:
                            'text-[#186049] hover:text-[#0f3d2c] font-medium',

                          dividerLine:
                            'bg-[#e8e3e5]',

                          dividerText:
                            'text-[#9a9298] text-[10px] uppercase tracking-widest bg-white',

                          socialButtonsBlockButton:
                            'bg-white border-[#d8cfd3] hover:bg-[#f8f1f2] text-[#242024] h-12 rounded-xl',

                          socialButtonsBlockButtonText:
                            'font-medium text-sm text-[#4e484d]',

                          identityPreviewText:
                            'text-[#242024]',

                          identityPreviewEditButtonIcon:
                            'text-[#186049]',

                          formFieldInputShowPasswordButton:
                            'text-[#9a9298] hover:text-[#242024]',
                        },
                      }}
                    />
                  </motion.div>
                ) : (

                  /* SIGN UP */
                  <motion.div
                    key="signup"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex w-full justify-center"
                  >
                    <SignUp
                      routing="hash"
                      appearance={{
                        elements: {
                          rootBox: 'mx-auto flex w-full justify-center',

                          card: 'mx-auto w-full rounded-2xl border border-[#e8e3e5] bg-white p-5 shadow-[0_18px_45px_rgba(83,52,62,0.12)] sm:p-7',

                          headerTitle: 'hidden',
                          headerSubtitle: 'hidden',

                          formButtonPrimary:
                            'w-full h-12 text-base mt-2 normal-case rounded-full bg-[#186049] hover:bg-[#0f3d2c] text-white shadow-md',

                          formFieldInput:
                            'bg-[#fffdfc] border-[#d8cfd3] rounded-xl h-12 px-4 text-[#242024] focus:border-[#186049] focus:ring-1 focus:ring-[#186049]/30',

                          formFieldLabel:
                            'text-[10px] uppercase tracking-widest font-bold text-[#716b70] mb-2',

                          footerActionText:
                            'text-[#716b70]',

                          footerActionLink:
                            'text-[#186049] hover:text-[#0f3d2c] font-medium',

                          dividerLine:
                            'bg-[#e8e3e5]',

                          dividerText:
                            'text-[#9a9298] text-[10px] uppercase tracking-widest bg-white',

                          socialButtonsBlockButton:
                            'bg-white border-[#d8cfd3] hover:bg-[#f8f1f2] text-[#242024] h-12 rounded-xl',

                          socialButtonsBlockButtonText:
                            'font-medium text-sm text-[#4e484d]',

                          identityPreviewText:
                            'text-[#242024]',

                          identityPreviewEditButtonIcon:
                            'text-[#186049]',

                          formFieldInputShowPasswordButton:
                            'text-[#9a9298] hover:text-[#242024]',
                        },
                      }}
                    />
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default Auth;



