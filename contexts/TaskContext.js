'use client';

import { createContext, useContext, useState, useEffect } from "react";
import { addTask, getTasks } from "../public/utils/indexedDb";
import { addTarefaFirestore, getTarefasFromFirestore } from "@/public/utils/firebase";

// Criação do contexto (espaço na memória)
const TaskContext = createContext();

// Hook ou função para acessar o contexto
export const useTaskContext = () => {
    return useContext(TaskContext);
}

// Provedor de contexto
export const TaskProvider = ({ children }) => {
    const [tasks, setTasks] = useState([]);
        const loadTasks = async () => {
            try {
                const tasksFromDB = await getTasks();
                if(navigator.onLine){
                    const tasksFromFirestore = await getTarefasFromFirestore();

                    const tasksMap = new Map();
                    tasksFromDB.forEach(task => tasksMap.set(task.id, task));
                    tasksFromFirestore.forEach(task => tasksMap.set(task.id, task));

                    const mergedTasks = Array.from(tasksMap.values());

                    await Promise.all(mergedTasks.map(async (task) => {
                        try{
                            await addTask(task)
                        } catch (error) {
                            console.error('Erro ao adicionar a tarefa durante a sincronização: ' + error)
                        }
                    }));
                    setTasks(mergedTasks);
                } else {
                    setTasks(tasksFromDB);
                }
            } catch (error) {
                console.error("Erro ao carregar e mesclar as tarefas: " + error);
            }
        };
        useEffect(() => {
            loadTasks();
        }, [])

    const addNewTask = async (task) => {
        try {
            if(navigator.onLine){
                await addTarefaFirestore(task);
            } 
            await addTask(task);
            await loadTasks();
        } catch (error) {
            console.error("Erro ao adicionar nova tarefa: " + error);
        }
    };

    return (
        <TaskContext.Provider value = {{tasks, addNewTask}}>
            {children}
        </TaskContext.Provider>
    );
}