// import { useState, useEffect } from 'react';
// import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth';
// import { auth } from './firebase';

// const useAuth = () => {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, (user) => {
//       setUser(user);
//     });

//     return () => unsubscribe();
//   }, []);

//   const signInWithGoogle = async () => {
//     setLoading(true);
//     try {
//       const provider = new GoogleAuthProvider();
//       const result = await signInWithPopup(auth, provider);
//       return result.user;
//     } catch (error) {
//       console.error('Google sign in error:', error);
//       throw error;
//     } finally {
//       setLoading(false);
//     }
//   };

//   const logout = async () => {
//     try {
//       await signOut(auth);
//     } catch (error) {
//       console.error('Logout error:', error);
//       throw error;
//     }
//   };

//   return {
//     user,
//     loading,
//     signInWithGoogle,
//     logout
//   };
// };

// export default useAuth;