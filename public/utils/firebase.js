import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, updateDoc, doc, query, where } from 'firebase/firestore';
import {getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile} from 'firebase/auth';
import { getAnalytics, isSupported, logEvent} from "firebase/analytics";

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
let analytics;

export const AnalyticsInit = async () => {
    if(await isSupported()){
        analytics = getAnalytics(app);
        console.log("Firebase Analytics foi inicializado com sucesso!");
    } else {
        console.warn("Firebase Analytics não é suportado nesse ambiente!");
    }
}

export const signIn = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password)
        if(analytics){
            logEvent(analytics, 'login', {
                uid: userCredential.uid,
                email: userCredential.email,
                createdAt: userCredential.createdAt
            })
            console.log('Evento de login de usuário registrado com sucesso!', {
                uid: userCredential.uid,
                email: userCredential.email,
                createdAt: userCredential.createdAt
            })
        }
        return userCredential.user;
    } catch (error) {
        console.error("Erro ao efetuar login: " + error);
        throw error;
    }
}

export const signUp = async (email, password, displayName) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        const user = userCredential.user;
        await updateProfile(user, { displayName });
        await addDoc(collection(db, 'users'), {
            uid: user.uid,
            email: user.email,
            displayName,
            createdAt: new Date(),
        });
        if(analytics){
            logEvent(analytics, 'registro', {
                uid: userCredential.uid,
                email: userCredential.email,
            })
            console.log('Evento de criação de usuário registrado com sucesso!', {
                uid: userCredential.uid,
                email: userCredential.email,
            })
        }
        return userCredential.user;
    } catch (error) {
        console.error("Erro ao criar a conta: " + error);
        throw error;
    }
}

export const addTarefaFirestore = async (tarefa) => {
    try {
        if (typeof tarefa === 'object' && !Array.isArray(tarefa) && tarefa !== null) {
            if (Object.keys(tarefa).length === 0) {
                    throw new Error("O objeto de tarefa está vazio.");
            }
            const docRef = await addDoc(collection(db, "tarefas"), tarefa);
            if(analytics){
                logEvent(analytics, 'add_task', {
                    tarefa_id: docRef.id,
                    tarefa_title: tarefa.title,
                    createdAt: new Date().toISOString()
                })
                console.log('Evento de adição de tarefa registrado com sucesso!', {
                    tarefa_id: docRef.id,
                    tarefa_title: tarefa.title,
                    createdAt: new Date().toISOString()
                })
            }
            console.log('Documento escrito com sucesso: ', docRef.id);
        } else {
            throw new Error("Dados inválidos para adicionar ao Firestore. Esperado um objeto.");
        }
    } catch (error) {
        console.error("Erro ao adicionar o documento:", error);
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
        console.error("Erro ao obter tarefas do Firestore: " + error)
    }
}

export const signOutFn = async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Erro ao sair da conta: " + error);
    }
}

export const updateTarefas = async (id, valor) => {
    try {
        const q = query(collection(db, "tarefas"), where('id', '==', id));
        const querySnapshot = await getDocs(q);
        let docID = '';
        querySnapshot.forEach((doc) => {
          docID = doc.id;
        });
        const tarefa = doc(db, "tarefas", docID);
        await updateDoc(tarefa, {
            completed: valor
        })
        .then(() => {
            console.log("Tarefa atualizada com sucesso!");
        })
        .catch((error) => {
            console.error("Erro ao atualizar a tarefa", error);
        });
    } catch (error) {
        console.error("Erro ao atualizar a tarefa: " + error);
    }
}