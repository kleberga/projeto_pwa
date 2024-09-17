'use client'

import { useState } from 'react'
import { useTaskContext } from '@/contexts/TaskContext'
import { signOutUser } from '@/public/utils/firebase';
import { useRouter } from "next/navigation";

export default function Home(){

    const { tasks, addNewTask } = useTaskContext();
    const [title, setTitle] = useState('');
    const [time, setTime] = useState('');
    const router = useRouter();

    const handleAddTask = (e) => {
        e.preventDefault();
        const newTask = {id: Date.now(), title, time, completed: false };
        addNewTask(newTask);
        setTitle('');
        setTime('');
    }

    const handleSignOut = async (event) => {
        event.preventDefault();
        try {
          await signOutUser();
          router.push('/');
        } catch (error){
          console.error("Erro ao sair da conta: " + error);
        }
      }



    return(
        <div className='min-h-screen p-6'>
            <h1 className='text-4xl mb-6 font-bold'>Dashboard - Minhas Tarefas Diárias</h1>
            <form onSubmit={handleAddTask} className='mb-6'>
                <input
                    type='text'
                    placeholder='Título'
                    className='border p-2 mr-2'
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                />
                <input 
                    type='time'
                    className='border p-2 mr-2'
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                    />

                    <button className='bg-blue-500 text-white p-2 rounded' type='submit'>
                        Adicionar Tarefa
                    </button>
            </form>
            <ul>
                {tasks.map((task, index) => (
                    <li key={index} className='border p-4 mb-2 flex justfy-between items-center bg-[#e0f2fe]'>
                        <span> {task.title} às {task.time} </span>
                    </li>
                ))}
            </ul>
            <br></br>
            <button className='bg-red-500 text-white p-2 rounded w-12' onClick={handleSignOut}>Sair</button>
        </div>
    )

    

}