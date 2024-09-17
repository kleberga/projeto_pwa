import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, updateDocs, doc, QuerySnapshot } from 'firebase/firestore';
import {getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut} from 'firebase/auth'

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_APIKEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTHDOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECTID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGEBUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGINGSENDERID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APPID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENTID,
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
export const auth = getAuth(app);

export const signIn = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password)
        return userCredential.user;
    } catch (error) {
        console.error("Erro ao efetuar login: " + error);
        throw error;
    }
}

export const signUp = async (email, password) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        return userCredential.user;
    } catch (error) {
        console.error("Erro ao criar a conta: " + error);
        throw error;
    }
}


export const addTarefaFirestore = async (tarefa) => {
    try {
        const docRef = await addDoc(collection(db, "tarefas"), tarefa)
        console.log('Documento escrito com sucesso: ', docRef.id);
    } catch (erro) {
        console.error("Erro ao adicionar o documento: " + erro)
    }
}

export const getTarefasFromFirestore = async () => {
    try {
        const query = await getDocs(collection(db, "tarefas"));
        return query.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));
    } catch (error) {
        console.error("Erro ao obter tarefas do Firestore: ", error)
    }

}

export const signOutUser = async () => {
    try {
        auth.signOut();
    } catch (error) {
        console.error("Erro ao sair da conta: " + error);
    }
}