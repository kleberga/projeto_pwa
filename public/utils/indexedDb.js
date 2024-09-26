import { openDB } from "idb";

export const openIndexedDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('my-tasks-db', 1);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('tasks')) {
                db.createObjectStore('tasks', { keyPath: 'id' }); 
            }
        };
        request.onsuccess = (event) => {
            resolve(event.target.result);
        };
        request.onerror = (event) => {
            reject(`Erro ao abrir o IndexedDB: ${event.target.errorCode}`);
        };
    });
};

export const addTask = async (task) => {
    try {
        const db = await openIndexedDB();
        const transaction = db.transaction(['tasks'], 'readwrite');
        const store = transaction.objectStore('tasks');
        if (!task.id) {
            task.id = Date.now();
        }
        task.synced = navigator.onLine;
        return new Promise((resolve, reject) => {
            const request = store.put(task); 
            request.onsuccess = () => {
                resolve(); 
            };
            request.onerror = (event) => {
                console.error(`Erro ao adicionar tarefa ao IndexedDB: ${event.target.errorCode}`);
                reject(`Erro ao adicionar tarefa: ${event.target.errorCode}`);
            };
        });
    } catch (error) {
        console.error('Erro no IndexedDB:', error);
        throw new Error(`Erro ao adicionar tarefa no IndexedDB: ${error}`);
    }
};

export const getTasks = async () => {
    try {
        const db = await openIndexedDB();
        const transaction = db.transaction(['tasks'], 'readonly');
        const store = transaction.objectStore('tasks');
        return new Promise((resolve, reject) => {
            const request = store.getAll(); 
            request.onsuccess = (event) => {
                resolve(event.target.result);
            };
            request.onerror = (event) => {
                reject(`Erro ao buscar tarefas do IndexedDB: ${event.target.errorCode}`);
            };
        });
    } catch (error) {
        console.error('Erro ao obter tarefas do IndexedDB:', error);
        throw new Error(`Erro ao obter tarefas do IndexedDB: ${error}`);
    }
};

export const setTasksDb = async (chave, valor, offline) => {
    try {
        const db = await openIndexedDB();
        const objectStore = await db.transaction(['tasks'], 'readwrite').objectStore('tasks');
        const request = objectStore.get(chave);
        request.onsuccess = ()=> {
            const tarefa = request.result;
            tarefa.completed = valor;
            if(offline){
                tarefa.synced = false;
            }
            const updateRequest = objectStore.put(tarefa);
            updateRequest.onsuccess = () => {
                console.log(`Tarefa atualizada: ${updateRequest.result}`)
            }
        }
    } catch (error) {
        console.error('Erro ao alterar tarefas do IndexedDB:', error);
        throw new Error(`Erro ao alterar tarefas do IndexedDB: ${error}`);
    }
};