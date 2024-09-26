'use client';

import PrivateRoute from '@/components/PrivateRoute';
import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { addTarefaFirestore, AnalyticsInit, getTarefasFromFirestore, updateTarefas } from '@/public/utils/firebase';
import { addTask, getTasks,setTasksDb } from '../../public/utils/indexedDb';

const requestNotificationPermission = () => {
  if(Notification.permission == 'default'){
    Notification.requestPermission().then(permission => {
      if(permission === 'default'){
        sendNotification('Notificações ativadas', 'Agora você receberá notificações')
      }
    })
  }
}

const sendNotification = (title, body) => {
  if (Notification.permission === 'granted') {
    new Notification(title, { body });
  }
};

export default function Home() {
  
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const[dateTime, setDateTime] = useState('')
  const [completed, setCompleted] = useState(false);
  const [isOffline, setIsOffline] = useState(false)
  useEffect(() => {
    setIsOffline(typeof window !== 'undefined' ? !navigator.onLine : false);
  }, []);
  const today = format(new Date(), 'yyyy-MM-dd')

  function findMismatchedIds(array1, array2) {
    const mismatchedIds = [];
    array1.forEach(item1 => {
        const match = array2.find(item2 => item2.id === item1.id);
        if (match && item1.completed !== match.completed) {
          mismatchedIds.push({'id': item1.id, 'completed': match.completed});
        }
    });
    return mismatchedIds;
  }

  function syncCompletedStatus(arr1, arr2) {
    arr1.forEach(item1 => {
        arr2.forEach(item2 => {
            if (item1.id === item2.id) {
                if (item1.completed !== item2.completed) {
                    item1.completed = item2.completed;
                }
            }
        });
    });
    return arr1;
  }

  const loadTasks = async () => {
    console.log("isOffline: " + isOffline)
    try {
      const tasksFromDB = await getTasks(); 
      if (navigator.onLine) {
        let tasksFromFirestore = await getTarefasFromFirestore(); 
        const completedAlterado = findMismatchedIds(tasksFromFirestore, tasksFromDB)
        await Promise.all(
          completedAlterado.map(async (task) => {
            try{
              await updateTarefas(task.id, task.completed)
            } catch (error){
              console.error('Erro ao atualizar a situação de uma tarefa:', error)
            }
          })
        )
        tasksFromFirestore = syncCompletedStatus(tasksFromFirestore, completedAlterado)
        const tasksMap = new Map();
        tasksFromDB.forEach(task => tasksMap.set(task.id, task));
        tasksFromFirestore.forEach(task => {
          const exists = tasksMap.has(tasks.id);
          if(!exists){
            tasksMap.set(task.id, task)
          }
        });
        const mergedTasks = Array.from(tasksMap.values());
        await Promise.all(
          mergedTasks.map(async (task) => {
            try {
              if(!task.synced){
                task.synced = true;
                await addTarefaFirestore(task); 
              }
              await addTask(task);
            } catch (error) {
              console.error('Erro ao adicionar tarefa durante a sincronização:', error);
            }
          })
        );
        setTasks(mergedTasks); 
      } else {
        setTasks(tasksFromDB); 
      }
    } catch (error) {
      console.error('Erro ao carregar e mesclar tarefas:', error);
    }
  };

  useEffect(() => {
    requestNotificationPermission();
    loadTasks(); 
    const handleOfflineStatus = () => {
      if(!navigator.onLine){
        setIsOffline(true);
        sendNotification('Você está offline', 'As tarefas adicionadas serão sincronizadas quando você estive online.')
      } else {
        setIsOffline(false);
        sendNotification('Você está online', 'A coneção foi reestabelecida')
        loadTasks()
      }
    };
    window.addEventListener('online', handleOfflineStatus);
    window.addEventListener('offline', handleOfflineStatus);
    const loadAnalytics = async () => {
      await AnalyticsInit();
    }
    if(typeof window !== 'undefined'){
      loadAnalytics();
    }
    return () => {
      window.removeEventListener('online', handleOfflineStatus);
      window.removeEventListener('offline', handleOfflineStatus);
    };
  }, []);


  const handleAddTask = async (e) => {
    e.preventDefault();
    const newTask = { 
      id: Date.now(), 
      title, 
      date: new Date(dateTime).toISOString(),
      completed,
      synced: navigator.onLine
     };
    try {
      if(navigator.onLine){
        const tasksFromFirestore = await getTarefasFromFirestore();
        const exists = tasksFromFirestore.some(task => task.title === newTask.title && task.date === newTask.date && task.completed === newTask.completed)
        if(!exists){
          await addTarefaFirestore(newTask)
        }
      }
      await addTask(newTask); 
      loadTasks(); 
    } catch (error) {
      console.error('Erro ao adicionar nova tarefa:', error);
    }
    setTitle('');
    setDateTime('');
    setCompleted(false);
  };


  const changeTask = async (chave, valor) => {
    await setTasksDb(chave, valor, isOffline);
    if(!isOffline){
      await updateTarefas(chave, valor);
    }
    await loadTasks();
  }


  const groupByDate = (tasks) => {
    const grouped = tasks.reduce((groups, task) => {
      const taskDate = parseISO(task.date)
      const formattedDate = format(taskDate, 'yyyy-MM-dd');
      const displayDate = formattedDate >= today ? formattedDate : 'passadas';
      if (!groups[displayDate]) {
        groups[displayDate] = [];
      }
      groups[displayDate].push(task);
      return groups;
    }, {});
    Object.keys(grouped).forEach(eachDate => {
      grouped[eachDate].sort((a, b) => {
        return new Date(a.date) - new Date(b.date);
      });
    });
    return grouped;
  };

  const groupedTasks = groupByDate(tasks);

  return (
    <PrivateRoute>
      <div className="container mx-auto min-h-screen p-6">
        <h1 className="text-3xl mb-6 font-bold">Tarefas Diárias</h1>
        {isOffline && (
          <div className='bg-red-500 text-white p-4 rounded mb-6'>
            Você está offline. As tarefas serão sincronizadas quando a conexão for restaurada!
          </div>
        )}
        <form onSubmit={handleAddTask} className="mb-6">
          <input
            type="text"
            placeholder="Título"
            className="border p-2 mr-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <input
            type="datetime-local"
            className="border p-2 mr-2"
            value={dateTime}
            onChange={(e) => setDateTime(e.target.value)}
            required
          />
          <button className="bg-blue-500 text-white p-2 rounded" type="submit">
            Adicionar Tarefa
          </button>
        </form>
        <br></br>
        
        {Object.keys(groupedTasks).filter(date => date !== 'passadas').map((date) => (
          <div key={date} className="mb-6">
            <h3 className="text-xl font-bold">
              {date === today ? 'Hoje' : format(parseISO(date), 'dd/MM/yyyy')}
            </h3>
            <ul>
              {groupedTasks[date].map((task) => (
                <li key={task.id} className={`border rounded-lg p-4 mb-2 flex justify-between items-center ${ task.completed == 'true' ? 'bg-green-200' : 'bg-red-200' }  ${ !task.synced ? 'border-red-500' : ''}`} >
                  <span>
                    <div className='font-bold'>{task.title}</div>
                    {format(new Date(task.date), 'HH:mm')} - {' '}
                    <select value={task.completed} onChange={(e) => changeTask(task.id, e.target.value)}>
                      <option value={true}>Concluída</option>
                      <option value={false}>Não concluída</option>
                    </select>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <h2 className="text-xl font-bold">Tarefas Passadas</h2>
        <ul>
          {groupedTasks['passadas']?.map((task) => (
            <li
              key={task.id}
              className={`border p-4 rounded-lg mb-2 flex justify-between items-center ${!task.synced ? 'text-gray-400 bg-gray-100 border-red-500' : 'text-gray-400 bg-gray-100'}`}
            >
              <span>
              <div className='font-bold'>{task.title}</div>
              {format(new Date(task.date), 'HH:mm')} em {format(parseISO(task.date), 'dd/MM/yyyy')} - {' '}
                <select value={task.completed} onChange={(e) => changeTask(task.id, e.target.value)}>
                      <option value={true}>Concluída</option>
                      <option value={false}>Não concluída</option>
                    </select>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </PrivateRoute>
  );
}