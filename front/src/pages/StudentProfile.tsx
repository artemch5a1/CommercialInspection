import { useState, useEffect, Fragment } from 'react';
import { getCurrentUser, getUserStatistics, saveStatistic } from '../services/api';

interface StudentProfileProps {
  onBack: () => void;
}

interface UserData {
  id: number;
  lastName: string;
  firstName: string;
  patronymic: string;
  profession: string;
  group: string;
  groupId?: number;
  foundDefects: number;
  availableLevel: string;
  availableLevelText: string;
  login: string;
}

interface Defect {
  name: string;
  comment?: string;
  status?: 'found' | 'not_found';
  id?: number;
  task_malfunction_id?: number;
}

interface LessonStats {
  id: number;
  date: string;
  theme: string;
  title: string;
  mode: string;
  grade: number;
  wagonType: string;
  defects: Defect[];
  comment?: string;
}

interface Task {
  id: number;
  name: string;
  description: string;
  training_mode: string;
  weather_conditions: string;
  times_day: string;
  topic_id: number;
  level?: string;
  topic?: {
    id: number;
    name: string;
  };
  user_id: number | null;
  group_id: number | null;
  access: 'all' | 'group' | 'user';
  task_malfunctions?: {
    id: number;
    malfunction: {
      id: number;
      name: string;
    };
  }[];
  created_at?: string;
}

// Функция для получения текстового описания уровня
const getLevelText = (level: string | undefined): string => {
  switch (level) {
    case 'simple':
      return 'Простой';
    case 'medium':
      return 'Средний';
    case 'hard':
      return 'Сложный';
    case 'maximum':
      return 'Максимальный';
    case 'beginner':
      return 'Начальный';
    case 'expert':
      return 'Эксперт';
    default:
      return level || 'Не определен';
  }
};

// Функция для получения цвета уровня
const getLevelColor = (level: string | undefined): string => {
  switch (level) {
    case 'simple':
    case 'beginner':
      return '#10b981';
    case 'medium':
      return '#3b82f6';
    case 'hard':
      return '#f59e0b';
    case 'maximum':
    case 'expert':
      return '#ef4444';
    default:
      return '#6b7280';
  }
};

// Функция для нормализации уровня
const normalizeLevel = (level: string | undefined): string => {
  const levelMap: { [key: string]: string } = {
    'простой уровень': 'simple',
    'средний уровень': 'medium',
    'сложный уровень': 'hard',
    'максимальный уровень': 'maximum',
    'начальный уровень': 'beginner',
    'simple': 'simple',
    'medium': 'medium',
    'hard': 'hard',
    'maximum': 'maximum',
    'beginner': 'beginner',
    'expert': 'expert'
  };
  return levelMap[String(level || '').toLowerCase()] || 'simple';
};

// Функция для сравнения уровней
const isTaskLevelHigher = (taskLevel: string | undefined, userLevel: string | undefined): boolean => {
  const levelOrder = ['beginner', 'simple', 'medium', 'hard', 'maximum', 'expert'];
  const normalizedTask = normalizeLevel(taskLevel);
  const normalizedUser = normalizeLevel(userLevel);
  
  const taskIndex = levelOrder.indexOf(normalizedTask);
  const userIndex = levelOrder.indexOf(normalizedUser);
  
  return taskIndex > userIndex;
};

// Функция для подсчета общего количества найденных неисправностей из статистики
const calculateTotalFoundDefects = (statistics: LessonStats[]): number => {
  let totalFound = 0;
  statistics.forEach(stat => {
    if (stat.defects && stat.defects.length > 0) {
      const foundCount = stat.defects.filter(d => d.status === 'found').length;
      totalFound += foundCount;
    }
  });
  return totalFound;
};

const StudentProfile = ({ onBack }: StudentProfileProps) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'statistics' | 'tasks'>('profile');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [statisticsData, setStatisticsData] = useState<LessonStats[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [expandedStat, setExpandedStat] = useState<number | null>(null);
  
  const [showModal, setShowModal] = useState(false);
  const [showLevelWarningModal, setShowLevelWarningModal] = useState(false);
  const [pendingTask, setPendingTask] = useState<{ task: Task; mode: 'practice' | 'exam' } | null>(null);
  const [modalMode, setModalMode] = useState<'practice' | 'exam'>('practice');
  const [modalTask, setModalTask] = useState<Task | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{
    foundDefects: Defect[];
    notFoundDefects: Defect[];
    grade: number;
    foundCount: number;
    totalCount: number;
  } | null>(null);

  useEffect(() => {
    loadUserData();
    loadTasks();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const result = await getCurrentUser();
      console.log('Current user data:', result);
      
      if (result.success && result.user) {
        const user = result.user;
        const levelText = getLevelText(user.level);
        
        setUserData({
          id: user.id,
          lastName: user.surname || user.lastName || '',
          firstName: user.name || user.firstName || '',
          patronymic: user.patronymic || '',
          profession: user.profession?.name || user.profession || 'Не указана',
          group: user.group?.name || user.group || 'Не указана',
          groupId: user.group?.id || user.group_id,
          foundDefects: 0, // Временно 0, будет обновлено после загрузки статистики
          availableLevel: user.level || 'simple',
          availableLevelText: levelText,
          login: user.login || ''
        });
        
        await loadUserStatistics(user.id);
      } else {
        setError('Не удалось загрузить данные пользователя');
      }
    } catch (err) {
      console.error('Error loading user data:', err);
      setError('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const loadUserStatistics = async (userId: number) => {
    try {
      const statsResult = await getUserStatistics(userId);
      console.log('Statistics data:', statsResult);
      
      if (statsResult && statsResult.success) {
        setStatisticsData(statsResult.statistics || []);
        
        // Подсчитываем общее количество найденных неисправностей
        const totalFoundDefects = calculateTotalFoundDefects(statsResult.statistics || []);
        console.log('Total found defects from statistics:', totalFoundDefects);
        
        // Обновляем userData с актуальным количеством найденных неисправностей
        setUserData(prev => prev ? {
          ...prev,
          foundDefects: totalFoundDefects
        } : null);
      } else {
        setStatisticsData([]);
      }
    } catch (err) {
      console.error('Error loading statistics:', err);
      setStatisticsData([]);
    }
  };

  const loadTasks = async () => {
    try {
      const response = await fetch('/api/tasks');
      const data = await response.json();
      
      if (data.success) {
        setTasks(data.tasks || []);
      }
    } catch (err) {
      console.error('Error loading tasks:', err);
    }
  };

  const getFilteredTasks = () => {
    if (!userData) return [];
    
    return tasks.filter(task => {
      switch (task.access) {
        case 'all':
          return true;
        case 'user':
          return task.user_id === userData.id;
        case 'group':
          return task.group_id === userData.groupId;
        default:
          return false;
      }
    });
  };

  const getTasksByTopic = () => {
    const filteredTasks = getFilteredTasks();
    const tasksByTopic: { [key: string]: Task[] } = {};
    
    filteredTasks.forEach(task => {
      const topicName = task.topic?.name || 'Без темы';
      if (!tasksByTopic[topicName]) {
        tasksByTopic[topicName] = [];
      }
      tasksByTopic[topicName].push(task);
    });
    
    return tasksByTopic;
  };

  const getUniqueTopics = () => {
    const tasksByTopic = getTasksByTopic();
    return Object.keys(tasksByTopic);
  };

  const determineDefectsStatus = (task: Task) => {
    if (!task.task_malfunctions || task.task_malfunctions.length === 0) {
      return { foundDefects: [], notFoundDefects: [], allDefects: [] };
    }

    const allDefects = task.task_malfunctions.map(tm => ({
      id: tm.malfunction.id,
      name: tm.malfunction.name,
      task_malfunction_id: tm.id
    }));

    const totalDefects = allDefects.length;
    const notFoundCount = Math.min(2, totalDefects);
    
    const shuffled = [...allDefects];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    const notFoundDefects = shuffled.slice(0, notFoundCount);
    const foundDefects = shuffled.slice(notFoundCount);

    return {
      foundDefects,
      notFoundDefects,
      allDefects
    };
  };

  const saveResults = async (task: Task, defectsWithStatus: any[]) => {
    try {
      const result = await saveStatistic({
        task_id: task.id,
        user_id: userData?.id,
        defects: defectsWithStatus
      });
      
      if (!result.success) {
        throw new Error(result.message || 'Ошибка сохранения');
      }
      
      return result;
    } catch (error) {
      console.error('Error saving results:', error);
      throw error;
    }
  };

  const handleStart = async () => {
    if (!modalTask || !userData) return;
    
    setIsProcessing(true);
    
    try {
      const { foundDefects, notFoundDefects, allDefects } = determineDefectsStatus(modalTask);
      
      const defectsWithStatus = allDefects.map(defect => ({
        task_malfunction_id: defect.task_malfunction_id,
        malfunction_name: defect.name,
        status: foundDefects.some(fd => fd.id === defect.id) ? 'found' : 'not_found'
      }));
      
      await saveResults(modalTask, defectsWithStatus);
      
      await loadUserStatistics(userData.id);
      await loadUserData();
      
      const totalCount = allDefects.length;
      const foundCount = foundDefects.length;
      const grade = totalCount > 0 ? (foundCount / totalCount) * 5 : 0;
      
      setResult({
        foundDefects: foundDefects,
        notFoundDefects: notFoundDefects,
        grade: grade,
        foundCount: foundCount,
        totalCount: totalCount
      });
      
    } catch (error) {
      console.error('Error during execution:', error);
      alert('Произошла ошибка при сохранении результатов');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setModalTask(null);
    setResult(null);
    setIsProcessing(false);
  };

  const handleCloseLevelWarning = () => {
    setShowLevelWarningModal(false);
    setPendingTask(null);
  };

  const handleContinueWithHigherLevel = () => {
    if (pendingTask) {
      setShowLevelWarningModal(false);
      setModalTask(pendingTask.task);
      setModalMode(pendingTask.mode);
      setShowModal(true);
      setPendingTask(null);
    }
  };

  const handleViewTask = (task: Task) => {
    setSelectedTask(task);
    setShowTaskDetails(true);
  };

  const handleBackToTasks = () => {
    setShowTaskDetails(false);
    setSelectedTask(null);
  };

  const handleOpenModal = (task: Task, mode: 'practice' | 'exam') => {
    if (userData && isTaskLevelHigher(task.level, userData.availableLevel)) {
      setPendingTask({ task, mode });
      setShowLevelWarningModal(true);
    } else {
      setModalTask(task);
      setModalMode(mode);
      setResult(null);
      setShowModal(true);
    }
  };

  const getGradeColor = (grade: number) => {
    if (grade >= 4.5) return '#10b981';
    if (grade >= 3.5) return '#3b82f6';
    if (grade >= 2.5) return '#f59e0b';
    return '#ef4444';
  };

  const getGradeBackground = (grade: number) => {
    if (grade >= 4.5) return 'rgba(16, 185, 129, 0.1)';
    if (grade >= 3.5) return 'rgba(59, 130, 246, 0.1)';
    if (grade >= 2.5) return 'rgba(245, 158, 11, 0.1)';
    return 'rgba(239, 68, 68, 0.1)';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const renderDefectsCell = (defects: Defect[]) => {
    if (!defects || defects.length === 0) {
      return <span style={{ color: '#6b7280' }}>—</span>;
    }

    const foundCount = defects.filter(d => d.status === 'found').length;
    const totalCount = defects.length;

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ 
          fontSize: '13px', 
          fontWeight: '500',
          color: foundCount === totalCount ? '#10b981' : '#6b7280'
        }}>
          {foundCount}/{totalCount}
        </span>
        <div style={{ 
          width: '40px', 
          height: '4px', 
          backgroundColor: '#374151', 
          borderRadius: '2px',
          overflow: 'hidden'
        }}>
          <div style={{ 
            width: `${(foundCount / totalCount) * 100}%`, 
            height: '100%', 
            backgroundColor: foundCount === totalCount ? '#10b981' : '#f59e0b',
            borderRadius: '2px'
          }} />
        </div>
      </div>
    );
  };

  const renderDefectsDetailed = (defects: Defect[]) => {
    if (!defects || defects.length === 0) {
      return <div style={{ color: '#6b7280', padding: '12px' }}>Нет данных о неисправностях</div>;
    }

    const foundDefects = defects.filter(d => d.status === 'found');
    const notFoundDefects = defects.filter(d => d.status === 'not_found');

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {foundDefects.length > 0 && (
          <div key="found-defects-section">
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              marginBottom: '10px'
            }}>
              <span style={{ 
                fontSize: '13px', 
                fontWeight: '500', 
                color: '#10b981',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Обнаруженные неисправности
              </span>
              <span style={{ 
                fontSize: '12px', 
                color: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                padding: '2px 8px',
                borderRadius: '12px'
              }}>
                {foundDefects.length}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {foundDefects.map((defect, index) => (
                <div key={`found-${index}`} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px',
                  padding: '6px 12px',
                  backgroundColor: '#1e1e24',
                  borderRadius: '6px',
                  borderLeft: '3px solid #10b981'
                }}>
                  <span style={{ 
                    width: '6px', 
                    height: '6px', 
                    backgroundColor: '#10b981', 
                    borderRadius: '50%'
                  }} />
                  <span style={{ fontSize: '13px', color: '#e5e7eb' }}>{defect.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {notFoundDefects.length > 0 && (
          <div key="not-found-defects-section">
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              marginBottom: '10px'
            }}>
              <span style={{ 
                fontSize: '13px', 
                fontWeight: '500', 
                color: '#ef4444',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Пропущенные неисправности
              </span>
              <span style={{ 
                fontSize: '12px', 
                color: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                padding: '2px 8px',
                borderRadius: '12px'
              }}>
                {notFoundDefects.length}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {notFoundDefects.map((defect, index) => (
                <div key={`not-found-${index}`} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px',
                  padding: '6px 12px',
                  backgroundColor: '#1e1e24',
                  borderRadius: '6px',
                  borderLeft: '3px solid #ef4444'
                }}>
                  <span style={{ 
                    width: '6px', 
                    height: '6px', 
                    backgroundColor: '#ef4444', 
                    borderRadius: '50%'
                  }} />
                  <span style={{ fontSize: '13px', color: '#e5e7eb' }}>{defect.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderModalContent = () => {
    if (result) {
      return (
        <div className="modal-result">
          <h3>Результаты {modalMode === 'practice' ? 'практики' : 'теста'}</h3>
          
          <div style={{ 
            textAlign: 'center', 
            padding: '20px',
            backgroundColor: getGradeBackground(result.grade),
            borderRadius: '12px',
            marginBottom: '20px'
          }}>
            <div style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '8px' }}>Оценка</div>
            <div style={{ 
              fontSize: '48px', 
              fontWeight: 'bold', 
              color: getGradeColor(result.grade)
            }}>
              {result.grade.toFixed(1)}
              <span style={{ fontSize: '20px', color: '#6b7280' }}>/5</span>
            </div>
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              marginBottom: '8px'
            }}>
              <span style={{ color: '#9ca3af' }}>Найдено неисправностей</span>
              <span style={{ color: '#e5e7eb', fontWeight: '500' }}>
                {result.foundCount} из {result.totalCount}
              </span>
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between'
            }}>
              <span style={{ color: '#9ca3af' }}>Процент выполнения</span>
              <span style={{ color: '#e5e7eb', fontWeight: '500' }}>
                {((result.foundCount / result.totalCount) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
          
          {result.foundDefects.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ 
                fontSize: '13px', 
                fontWeight: '500', 
                color: '#10b981',
                marginBottom: '10px'
              }}>
                Обнаруженные неисправности ({result.foundDefects.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {result.foundDefects.map((defect, idx) => (
                  <div key={`modal-found-${idx}`} style={{ 
                    padding: '8px 12px',
                    backgroundColor: '#1e1e24',
                    borderRadius: '6px',
                    color: '#e5e7eb',
                    fontSize: '13px'
                  }}>
                    {defect.name}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {result.notFoundDefects.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ 
                fontSize: '13px', 
                fontWeight: '500', 
                color: '#ef4444',
                marginBottom: '10px'
              }}>
                Пропущенные неисправности ({result.notFoundDefects.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {result.notFoundDefects.map((defect, idx) => (
                  <div key={`modal-not-found-${idx}`} style={{ 
                    padding: '8px 12px',
                    backgroundColor: '#1e1e24',
                    borderRadius: '6px',
                    color: '#e5e7eb',
                    fontSize: '13px'
                  }}>
                    {defect.name}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <button className="modal-close-btn" onClick={handleCloseModal}>
            Закрыть
          </button>
        </div>
      );
    }

    return (
      <div className="modal-confirm">
        <h3>Задание: {modalTask?.name}</h3>
        <p className="modal-warning">Внимание: результаты будут сохранены в статистику!</p>
        <div className="modal-buttons">
          <button 
            className="modal-cancel-btn" 
            onClick={handleCloseModal}
            disabled={isProcessing}
          >
            Отмена
          </button>
          <button 
            className="modal-start-btn" 
            onClick={handleStart}
            disabled={isProcessing}
          >
            {isProcessing ? 'Обработка...' : 'Начать'}
          </button>
        </div>
      </div>
    );
  };

  const renderLevelWarningModal = () => {
    if (!pendingTask) return null;
    
    const taskLevelText = getLevelText(pendingTask.task.level);
    const userLevelText = userData?.availableLevelText || 'Не определен';
    const taskLevelColor = getLevelColor(pendingTask.task.level);
    
    return (
      <div className="modal-overlay" onClick={handleCloseLevelWarning}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="level-warning">
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>⚠️</div>
              <h3 style={{ color: '#f59e0b', marginBottom: '10px' }}>Предупреждение</h3>
            </div>
            
            <p style={{ marginBottom: '15px', color: '#e5e7eb' }}>
              Уровень сложности задания <strong style={{ color: taskLevelColor }}>{taskLevelText}</strong> 
              превышает ваш текущий уровень <strong style={{ color: getLevelColor(userData?.availableLevel) }}>{userLevelText}</strong>.
            </p>
            
            <p style={{ marginBottom: '20px', color: '#9ca3af', fontSize: '13px' }}>
              Задание может быть слишком сложным для вас. Вы уверены, что хотите продолжить?
            </p>
            
            <div className="modal-buttons" style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button className="modal-cancel-btn" onClick={handleCloseLevelWarning}>
                Отмена
              </button>
              <button 
                className="modal-start-btn" 
                onClick={handleContinueWithHigherLevel}
                style={{ backgroundColor: '#f59e0b' }}
              >
                Продолжить
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Загрузка данных...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button className="retry-btn" onClick={loadUserData}>Повторить</button>
        </div>
      );
    }

    if (!userData) {
      return (
        <div className="error-container">
          <p className="error-message">Данные пользователя не найдены</p>
          <button className="retry-btn" onClick={onBack}>Выйти</button>
        </div>
      );
    }

    switch (activeTab) {
      case 'profile':
        return (
          <>
            <h2 style={{ marginBottom: '24px', color: '#e5e7eb' }}>Личный кабинет</h2>
            <div className="profile-info">
              <div className="info-row">
                <span className="info-label">Фамилия</span>
                <span className="info-value">{userData.lastName}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Имя</span>
                <span className="info-value">{userData.firstName}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Отчество</span>
                <span className="info-value">{userData.patronymic || '—'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Логин</span>
                <span className="info-value">{userData.login}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Профессия</span>
                <span className="info-value">{userData.profession}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Группа</span>
                <span className="info-value">{userData.group}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Найдено неисправностей</span>
                <span className="info-value" style={{ color: '#10b981', fontWeight: '600' }}>
                  {userData.foundDefects}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">Уровень сложности</span>
                <span className="info-value" style={{ 
                  color: getLevelColor(userData.availableLevel),
                  fontWeight: '600',
                  display: 'inline-block',
                  padding: '4px 12px',
                  backgroundColor: `${getLevelColor(userData.availableLevel)}20`,
                  borderRadius: '20px'
                }}>
                  {userData.availableLevelText}
                </span>
              </div>
            </div>
          </>
        );
      
      case 'statistics':
        return (
          <>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <h2 style={{ color: '#e5e7eb', margin: 0 }}>Статистика прохождения заданий</h2>
              {statisticsData.length > 0 && (
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', color: '#b3bf76' }}>Всего</div>
                    <div style={{ fontSize: '20px', fontWeight: '600', color: '#e5e7eb' }}>
                      {statisticsData.length}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', color: '#b3bf76' }}>Средний балл</div>
                    <div style={{ 
                      fontSize: '20px', 
                      fontWeight: '600',
                      color: getGradeColor(
                        statisticsData.reduce((acc, s) => acc + s.grade, 0) / statisticsData.length
                      )
                    }}>
                      {(statisticsData.reduce((acc, s) => acc + s.grade, 0) / statisticsData.length).toFixed(1)}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {statisticsData.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '60px 20px',
                color: '#b3bf76'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>📋</div>
                <p style={{ fontSize: '16px', marginBottom: '8px' }}>Нет пройденных заданий</p>
                <p style={{ fontSize: '13px' }}>Выполните задания, чтобы увидеть статистику</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ 
                  width: '100%', 
                  borderCollapse: 'collapse',
                  fontSize: '13px'
                }}>
                  <thead>
                    <tr style={{ 
                      borderBottom: '1px solid #374151',
                      backgroundColor: '#1a1a20'
                    }}>
                      <th style={{ padding: '12px 8px', textAlign: 'left', color: '#b3bf76', fontWeight: '500', width: '40px' }}>№</th>
                      <th style={{ padding: '12px 8px', textAlign: 'left', color: '#b3bf76', fontWeight: '500', width: '90px' }}>Дата</th>
                      <th style={{ padding: '12px 8px', textAlign: 'left', color: '#b3bf76', fontWeight: '500' }}>Тема</th>
                      <th style={{ padding: '12px 8px', textAlign: 'left', color: '#b3bf76', fontWeight: '500' }}>Задание</th>
                      <th style={{ padding: '12px 8px', textAlign: 'left', color: '#b3bf76', fontWeight: '500', width: '100px' }}>Режим</th>
                      <th style={{ padding: '12px 8px', textAlign: 'center', color: '#b3bf76', fontWeight: '500', width: '80px' }}>Оценка</th>
                      <th style={{ padding: '12px 8px', textAlign: 'left', color: '#b3bf76', fontWeight: '500', width: '100px' }}>Неисправности</th>
                      <th style={{ padding: '12px 8px', textAlign: 'center', color: '#b3bf76', fontWeight: '500', width: '40px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {statisticsData.map((stat, index) => (
                      <Fragment key={stat.id}>
                        <tr 
                          onClick={() => setExpandedStat(expandedStat === stat.id ? null : stat.id)}
                          style={{ 
                            borderBottom: '1px solid #2a2a35',
                            backgroundColor: expandedStat === stat.id ? '#252530' : 'transparent',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            if (expandedStat !== stat.id) {
                              e.currentTarget.style.backgroundColor = '#1e1e28';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (expandedStat !== stat.id) {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }
                          }}
                        >
                          <td style={{ padding: '12px 8px', color: '#6b7280' }}>{index + 1}</td>
                          <td style={{ padding: '12px 8px', color: '#9ca3af' }}>{formatDate(stat.date)}</td>
                          <td style={{ padding: '12px 8px', color: '#e5e7eb' }}>{stat.theme}</td>
                          <td style={{ padding: '12px 8px', color: '#e5e7eb' }}>{stat.title}</td>
                          <td style={{ padding: '12px 8px' }}>
                            <span style={{ 
                              display: 'inline-block',
                              padding: '4px 10px',
                              backgroundColor: stat.mode === 'Экзамен' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                              color: stat.mode === 'Экзамен' ? '#ef4444' : '#3b82f6',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '500',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px'
                            }}>
                              {stat.mode}
                            </span>
                          </td>
                          <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                            <span style={{ 
                              display: 'inline-block',
                              padding: '4px 8px',
                              backgroundColor: getGradeBackground(stat.grade),
                              color: getGradeColor(stat.grade),
                              borderRadius: '4px',
                              fontWeight: '600',
                              fontSize: '13px'
                            }}>
                              {stat.grade.toFixed(1)}
                            </span>
                          </td>
                          <td style={{ padding: '12px 8px' }}>
                            {renderDefectsCell(stat.defects)}
                          </td>
                          <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                            <span style={{ 
                              display: 'inline-block',
                              color: '#6b7280',
                              transform: expandedStat === stat.id ? 'rotate(180deg)' : 'none',
                              transition: 'transform 0.2s',
                              fontSize: '12px'
                            }}>
                              ▼
                            </span>
                          </td>
                        </tr>
                        {expandedStat === stat.id && (
                          <tr>
                            <td colSpan={8} style={{ 
                              padding: '20px 24px',
                              backgroundColor: '#1a1a22',
                              borderBottom: '1px solid #2a2a35'
                            }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div>
                                  <div style={{ 
                                    fontSize: '12px', 
                                    fontWeight: '500', 
                                    color: '#9ca3af',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    marginBottom: '12px'
                                  }}>
                                    Детали неисправностей
                                  </div>
                                  {renderDefectsDetailed(stat.defects)}
                                </div>
                                {stat.comment && (
                                  <div>
                                    <div style={{ 
                                      fontSize: '12px', 
                                      fontWeight: '500', 
                                      color: '#9ca3af',
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.5px',
                                      marginBottom: '8px'
                                    }}>
                                      Комментарий
                                    </div>
                                    <div style={{ 
                                      padding: '12px',
                                      backgroundColor: '#1e1e24',
                                      borderRadius: '6px',
                                      color: '#d1d5db',
                                      fontSize: '13px',
                                      borderLeft: '3px solid #6b7280'
                                    }}>
                                      {stat.comment}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        );
      
      case 'tasks':
        if (showTaskDetails && selectedTask) {
          return (
            <div style={{
              width: '100%',
              height: '100%',
              background: '#211f25',
              padding: '30px',
              overflow: 'auto',
              borderRadius: '20px',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h2 style={{ color: '#b3bf76', margin: 0 }}>Детали задания</h2>
                <button
                  className="back-btn"
                  onClick={handleBackToTasks}
                  style={{ padding: '10px 20px' }}
                >
                  ← Назад
                </button>
              </div>

              <div className="assignment-details-card" style={{ flex: 1 }}>
                <div className="details-row">
                  <span className="details-label">Тема:</span>
                  <span className="details-value">{selectedTask.topic?.name || 'Без темы'}</span>
                </div>
                <div className="details-row">
                  <span className="details-label">Название:</span>
                  <span className="details-value">{selectedTask.name}</span>
                </div>
                <div className="details-row">
                  <span className="details-label">Описание:</span>
                  <span className="details-value">{selectedTask.description}</span>
                </div>
                <div className="details-row">
                  <span className="details-label">Уровень сложности:</span>
                  <span className="details-value" style={{ 
                    color: getLevelColor(selectedTask.level),
                    fontWeight: '600'
                  }}>
                    {getLevelText(selectedTask.level)}
                  </span>
                </div>
                <div className="details-row">
                  <span className="details-label">Режим:</span>
                  <span className="details-value">{selectedTask.training_mode || 'Не указан'}</span>
                </div>
                <div className="details-row">
                  <span className="details-label">Время суток:</span>
                  <span className="details-value">{selectedTask.times_day || 'Не выбрано'}</span>
                </div>
                <div className="details-row">
                  <span className="details-label">Погодные условия:</span>
                  <span className="details-value">{selectedTask.weather_conditions || 'Не выбрано'}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end', marginTop: '30px' }}>
                <button className="create-btn" onClick={() => handleOpenModal(selectedTask, 'practice')}>
                  Практика
                </button>
                <button className="submit-btn" onClick={() => handleOpenModal(selectedTask, 'exam')}>
                  Тест
                </button>
              </div>
            </div>
          );
        }

        return (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2>Доступные задания</h2>
            </div>

            {getUniqueTopics().length > 0 ? (
              <>
                <div className="topics-list">
                  {getUniqueTopics().map(topicName => (
                    <div
                      key={topicName}
                      className={`topic-item ${selectedTopic === topicName ? 'active' : ''}`}
                      onClick={() => setSelectedTopic(selectedTopic === topicName ? null : topicName)}
                    >
                      <span className="topic-name">{topicName}</span>
                      <span className="topic-count">{getTasksByTopic()[topicName].length} заданий</span>
                    </div>
                  ))}
                </div>

                {selectedTopic && (
                  <div className="assignments-by-topic">
                    <h3>Задания по теме: {selectedTopic}</h3>
                    <div className="assignments-list">
                      {getTasksByTopic()[selectedTopic].map(task => (
                        <div key={task.id} className="assignment-card">
                          <div className="assignment-header">
                            <h4>{task.name}</h4>
                            <span className="assignment-date">
                              {task.created_at ? new Date(task.created_at).toLocaleDateString() : 'Дата не указана'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: '10px', marginTop: '8px', marginBottom: '8px' }}>
                            <span className="difficulty-badge" style={{ 
                              backgroundColor: `${getLevelColor(task.level)}20`,
                              color: getLevelColor(task.level),
                              border: `1px solid ${getLevelColor(task.level)}40`
                            }}>
                              Уровень: {getLevelText(task.level)}
                            </span>
                            <span className="difficulty-badge">
                              Режим: {task.training_mode || 'Не указан'}
                            </span>
                          </div>
                          <div className="assignment-actions-card" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button
                              className="execute-btn"
                              onClick={() => handleViewTask(task)}
                            >
                              Просмотр
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="no-assignments">
                <p>Нет доступных заданий. Обратитесь к преподавателю.</p>
              </div>
            )}
          </>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="student-page">
      <div className="student-work-area">
        {renderContent()}
      </div>

      <div className="student-sidebar">
        <div className="menu-buttons-wrapper">
          <div className="menu-buttons">
            <button
              className={`menu-btn student-btn ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <span className="btn-title">Личный кабинет</span>
            </button>

            <button
              className={`menu-btn teacher-btn ${activeTab === 'statistics' ? 'active' : ''}`}
              onClick={() => setActiveTab('statistics')}
            >
              <span className="btn-title">Статистика</span>
              <span className="btn-subtitle">данные о пройденных уроках</span>
            </button>

            <button
              className={`menu-btn guest-btn ${activeTab === 'tasks' ? 'active' : ''}`}
              onClick={() => setActiveTab('tasks')}
            >
              <span className="btn-title">Задания</span>
              <span className="btn-subtitle">выберите задания для прохождения</span>
            </button>
            <button className="modal-btn cancel-btn" onClick={onBack}>Выход</button>
          </div>
        </div>
      </div>
      
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {renderModalContent()}
          </div>
        </div>
      )}
      
      {renderLevelWarningModal()}
    </div>
  );
};

export default StudentProfile;