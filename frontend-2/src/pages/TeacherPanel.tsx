import { useState, useEffect } from 'react';
import { 
  getUsers, registerUser,
  getGroups, createGroup, updateGroup, deleteGroup,
  getProfessions, createProfession, updateProfession, deleteProfession,
  getTopics, createTopic, updateTopic, deleteTopic
} from '../services/api';

interface TeacherProfileProps {
  onBack: () => void;
}

interface Group {
  id: number;
  name: string;
}

interface Profession {
  id: number;
  name: string;
}

interface Topic {
  id: number;
  name: string;
}

interface User {
  id: number;
  name: string;
  surname: string;
  patronymic: string;
  login: string;
  password?: string;
  pol: string;
  role: boolean;
  profession_id: number | null;
  profession?: Profession;
  group_id: number | null;
  group?: Group;
}

interface Student {
  id: number;
  lastName: string;
  firstName: string;
  patronymic: string;
  group: string;
  profession: string;
  login?: string;
  password?: string;
  gender?: string;
}

interface RegistrationFormData {
  login: string;
  password: string;
  lastName: string;
  firstName: string;
  patronymic: string;
  gender: string;
  group: string;
  profession: string;
}

interface ManagementItem {
  id: number;
  name: string;
}

interface Defect {
  id: number;
  name: string;
  description: string;
}

interface Assignment {
  id: number;
  topic: string;
  title: string;
  description: string;
  modes: string[];
  weather: string;
  timeOfDay: string;
  assignedTo: string[];
  groups: string[];
  students: number[];
  selectedDefects: number[];
  createdAt: string;
  difficulty?: string;
}

interface LessonStats {
  id: number;
  date: string;
  theme: string;
  title: string;
  mode: string;
  grade: number;
  wagonType: string;
  defects: { name: string; comment?: string }[];
  comment: string;
}

const TeacherProfile = ({ onBack }: TeacherProfileProps) => {
  const [activeTab, setActiveTab] = useState<'all-students' | 'registration' | 'management' | 'assignments' | 'statistics'>('all-students');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [selectedProfession, setSelectedProfession] = useState<string>('all');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [showAssignmentDetails, setShowAssignmentDetails] = useState(false);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [selectedStudentForEdit, setSelectedStudentForEdit] = useState<Student | null>(null);
  const [selectedStudentForStats, setSelectedStudentForStats] = useState<Student | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<RegistrationFormData>({
    login: '',
    password: '',
    lastName: '',
    firstName: '',
    patronymic: '',
    gender: '',
    group: '',
    profession: ''
  });

  const [managementType, setManagementType] = useState<'groups' | 'professions' | 'topics'>('groups');
  const [groups, setGroups] = useState<ManagementItem[]>([
    { id: 1, name: 'ПТ-41' },
    { id: 2, name: 'ПТ-42' },
    { id: 3, name: 'ПТ-43' }
  ]);
  const [professions, setProfessions] = useState<ManagementItem[]>([
    { id: 1, name: 'Инженер-дефектоскопист' },
    { id: 2, name: 'Техник-дефектоскопист' }
  ]);
  const [topics, setTopics] = useState<ManagementItem[]>([
    { id: 1, name: 'Дефектоскопия колесных пар' },
    { id: 2, name: 'Ультразвуковой контроль' },
    { id: 3, name: 'Магнитопорошковый метод' }
  ]);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [currentManagementType, setCurrentManagementType] = useState<'groups' | 'professions' | 'topics'>('groups');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ManagementItem | null>(null);
  const [editItemName, setEditItemName] = useState('');

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ManagementItem | null>(null);

  const [newAssignment, setNewAssignment] = useState({
    topic: '',
    title: '',
    description: '',
    modes: [] as string[],
    weather: '',
    timeOfDay: '',
    assignedTo: [] as string[],
    groups: [] as string[],
    students: [] as number[],
    selectedDefects: [] as number[],
    difficulty: ''
  });
  const [selectedAssignedType, setSelectedAssignedType] = useState<string>('');

  const [availableDefects, setAvailableDefects] = useState<Defect[]>([
    { id: 1, name: 'Трещина ступицы', description: 'Трещина в ступице колеса' },
    { id: 2, name: 'Износ гребня', description: 'Превышение допустимого износа гребня' },
    { id: 3, name: 'Раковина на поверхности', description: 'Раковина на поверхности детали' },
    { id: 4, name: 'Поверхностные трещины', description: 'Множественные трещины на корпусе' },
    { id: 5, name: 'Сколы краски', description: 'Сколы лакокрасочного покрытия' },
    { id: 6, name: 'Деформация', description: 'Деформация конструкции' }
  ]);
  const [selectedDefects, setSelectedDefects] = useState<Defect[]>([]);

  const [assignments, setAssignments] = useState<Assignment[]>([]);

  const statisticsData: LessonStats[] = [
    {
      id: 1,
      date: '15.03.2026',
      theme: 'Дефектоскопия колесных пар',
      title: 'Урок 1: Визуальный осмотр',
      mode: 'Тренировочный',
      grade: 85,
      wagonType: 'Грузовой вагон',
      defects: [
        { name: 'Трещина ступицы', comment: 'Глубокая трещина' },
        { name: 'Износ гребня', comment: 'Превышение нормы' }
      ],
      comment: 'Хорошая работа'
    },
    {
      id: 2,
      date: '18.03.2026',
      theme: 'Ультразвуковой контроль',
      title: 'Урок 2: Работа с дефектоскопом',
      mode: 'Экзамен',
      grade: 92,
      wagonType: 'Пассажирский вагон',
      defects: [{ name: 'Раковина на поверхности' }],
      comment: 'Отлично!'
    },
    {
      id: 3,
      date: '22.03.2026',
      theme: 'Магнитопорошковый метод',
      title: 'Урок 3: Выявление трещин',
      mode: 'Тест',
      grade: 78,
      wagonType: 'Цистерна',
      defects: [{ name: 'Поверхностные трещины', comment: 'Требуется ремонт' }],
      comment: 'Требуется дополнительная практика'
    }
  ];

  const studentsList: Student[] = [
    { id: 1, lastName: 'Иванов', firstName: 'Иван', patronymic: 'Иванович', group: 'ПТ-41', profession: 'Инженер-дефектоскопист', login: 'ivanov', password: '123', gender: 'male' },
    { id: 2, lastName: 'Петрова', firstName: 'Анна', patronymic: 'Сергеевна', group: 'ПТ-41', profession: 'Техник-дефектоскопист', login: 'petrova', password: '123', gender: 'female' },
    { id: 3, lastName: 'Сидоров', firstName: 'Алексей', patronymic: 'Владимирович', group: 'ПТ-42', profession: 'Инженер-дефектоскопист', login: 'sidorov', password: '123', gender: 'male' },
    { id: 4, lastName: 'Кузнецова', firstName: 'Елена', patronymic: 'Андреевна', group: 'ПТ-42', profession: 'Техник-дефектоскопист', login: 'kuznetsova', password: '123', gender: 'female' },
    { id: 5, lastName: 'Михайлов', firstName: 'Дмитрий', patronymic: 'Петрович', group: 'ПТ-43', profession: 'Инженер-дефектоскопист', login: 'mikhailov', password: '123', gender: 'male' },
    { id: 6, lastName: 'Соколова', firstName: 'Мария', patronymic: 'Игоревна', group: 'ПТ-43', profession: 'Техник-дефектоскопист', login: 'sokolova', password: '123', gender: 'female' }
  ];

  const [students, setStudents] = useState<Student[]>(studentsList);

  const groupOptions = groups.map(g => g.name);
  const professionOptions = professions.map(p => p.name);
  const topicOptions = topics.map(t => t.name);
  const weatherOptions = ['Ясно', 'Облачно', 'Дождь', 'Туман'];
  const timeOptions = ['Утро', 'День', 'Вечер', 'Ночь'];
  const difficultyOptions = ['Низкий', 'Средний', 'Высокий'];

  const loadData = async () => {
    try {
      const groupsData = await getGroups();
      if (groupsData && groupsData.length > 0) {
        setGroups(groupsData.map((g: any) => ({ id: g.id_group || g.id, name: g.name })));
      }
      
      const professionsData = await getProfessions();
      if (professionsData && professionsData.length > 0) {
        setProfessions(professionsData.map((p: any) => ({ id: p.id_profession || p.id, name: p.name })));
      }
      
      const topicsData = await getTopics();
      if (topicsData && topicsData.length > 0) {
        setTopics(topicsData.map((t: any) => ({ id: t.id_topic || t.id, name: t.name })));
      }
      
      const usersData = await getUsers();
      if (usersData && usersData.length > 0) {
        const convertedStudents = usersData.map((user: any) => ({
          id: user.id,
          lastName: user.surname,
          firstName: user.name,
          patronymic: user.patronymic,
          group: user.group?.name || '',
          profession: user.profession?.name || '',
          login: user.login,
          gender: user.pol
        }));
        setStudents(convertedStudents);
      }
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStudentClick = (student: Student, action: 'edit' | 'stats') => {
    if (action === 'edit') {
      setSelectedStudentForEdit(student);
      setFormData({
        login: student.login || '',
        password: student.password || '',
        lastName: student.lastName,
        firstName: student.firstName,
        patronymic: student.patronymic,
        gender: student.gender || '',
        group: student.group,
        profession: student.profession
      });
      setActiveTab('registration');
    } else if (action === 'stats') {
      setSelectedStudentForStats(student);
      setActiveTab('statistics');
    }
  };

  const renderDefects = (defects: { name: string; comment?: string }[]) => {
    if (defects.length === 0) {
      return <span className="no-defects">Дефектов не обнаружено</span>;
    }
    return (
      <div className="defects-list">
        {defects.map((defect, index) => (
          <div key={index} className="defect-item">
            <span className="defect-name">{defect.name}</span>
            {defect.comment && <span className="defect-comment">: {defect.comment}</span>}
          </div>
        ))}
      </div>
    );
  };

  const handleOpenCreateForm = () => {
    setNewAssignment({
      topic: '',
      title: '',
      description: '',
      modes: [],
      weather: '',
      timeOfDay: '',
      assignedTo: [],
      groups: [],
      students: [],
      selectedDefects: [],
      difficulty: ''
    });
    setSelectedDefects([]);
    setSelectedAssignedType('');
    setAvailableDefects([
      { id: 1, name: 'Трещина ступицы', description: 'Трещина в ступице колеса' },
      { id: 2, name: 'Износ гребня', description: 'Превышение допустимого износа гребня' },
      { id: 3, name: 'Раковина на поверхности', description: 'Раковина на поверхности детали' },
      { id: 4, name: 'Поверхностные трещины', description: 'Множественные трещины на корпусе' },
      { id: 5, name: 'Сколы краски', description: 'Сколы лакокрасочного покрытия' },
      { id: 6, name: 'Деформация', description: 'Деформация конструкции' }
    ]);
    setShowCreateForm(true);
    setShowAssignmentDetails(false);
    setShowTemplateForm(false);
  };

  const handleModeChange = (mode: string) => {
    setNewAssignment(prev => ({
      ...prev,
      modes: prev.modes.includes(mode)
        ? prev.modes.filter(m => m !== mode)
        : [...prev.modes, mode]
    }));
  };

  const handleAssignedToChange = (type: string) => {
    if (selectedAssignedType === type) {
      setSelectedAssignedType('');
      setNewAssignment(prev => ({ ...prev, assignedTo: [], groups: [], students: [] }));
    } else {
      setSelectedAssignedType(type);
      setNewAssignment(prev => ({ ...prev, assignedTo: [type], groups: [], students: [] }));
    }
  };

  const handleAddDefect = (defect: Defect) => {
    setAvailableDefects(availableDefects.filter(d => d.id !== defect.id));
    setSelectedDefects([...selectedDefects, defect]);
  };

  const handleRemoveDefect = (defect: Defect) => {
    setSelectedDefects(selectedDefects.filter(d => d.id !== defect.id));
    setAvailableDefects([...availableDefects, defect].sort((a, b) => a.id - b.id));
  };

  const handleCreateAssignment = () => {
    if (!newAssignment.topic || !newAssignment.title || !newAssignment.description) {
      alert('Заполните обязательные поля');
      return;
    }

    const newAssignmentItem: Assignment = {
      id: Date.now(),
      topic: newAssignment.topic,
      title: newAssignment.title,
      description: newAssignment.description,
      modes: newAssignment.modes,
      weather: newAssignment.weather,
      timeOfDay: newAssignment.timeOfDay,
      assignedTo: newAssignment.assignedTo,
      groups: newAssignment.groups,
      students: newAssignment.students,
      selectedDefects: selectedDefects.map(d => d.id),
      createdAt: new Date().toLocaleString(),
      difficulty: newAssignment.difficulty
    };

    setAssignments([...assignments, newAssignmentItem]);
    setShowCreateForm(false);
    alert('Задание успешно создано!');
  };

  const handleViewAssignment = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setShowAssignmentDetails(true);
    setShowCreateForm(false);
    setShowTemplateForm(false);
  };

  const handleBackToList = () => {
    setShowAssignmentDetails(false);
    setSelectedAssignment(null);
    setShowTemplateForm(false);
    setShowCreateForm(false);
  };

  const handleEditAssignment = () => {
    if (selectedAssignment) {
      setNewAssignment({
        topic: selectedAssignment.topic,
        title: selectedAssignment.title,
        description: selectedAssignment.description,
        modes: selectedAssignment.modes,
        weather: selectedAssignment.weather,
        timeOfDay: selectedAssignment.timeOfDay,
        assignedTo: selectedAssignment.assignedTo,
        groups: selectedAssignment.groups,
        students: selectedAssignment.students,
        selectedDefects: selectedAssignment.selectedDefects,
        difficulty: selectedAssignment.difficulty || ''
      });
      
      const restoredDefects = selectedAssignment.selectedDefects
        .map(id => {
          const allDefects = [...availableDefects, ...selectedDefects];
          return allDefects.find(d => d.id === id);
        })
        .filter((d): d is Defect => d !== undefined);
      
      setSelectedDefects(restoredDefects);
      setAvailableDefects(prev => prev.filter(d => !restoredDefects.some(rd => rd.id === d.id)));
      setSelectedAssignedType(selectedAssignment.assignedTo[0] || '');
      setShowCreateForm(true);
      setShowAssignmentDetails(false);
    }
  };

  const handleDeleteAssignment = () => {
    if (selectedAssignment && confirm('Вы уверены, что хотите удалить это задание?')) {
      setAssignments(assignments.filter(a => a.id !== selectedAssignment.id));
      setShowAssignmentDetails(false);
      setSelectedAssignment(null);
    }
  };

  const handleCreateTemplate = () => {
    if (selectedAssignment) {
      setNewAssignment({
        topic: selectedAssignment.topic,
        title: selectedAssignment.title,
        description: selectedAssignment.description,
        modes: selectedAssignment.modes,
        weather: selectedAssignment.weather,
        timeOfDay: selectedAssignment.timeOfDay,
        assignedTo: selectedAssignment.assignedTo,
        groups: selectedAssignment.groups,
        students: selectedAssignment.students,
        selectedDefects: selectedAssignment.selectedDefects,
        difficulty: selectedAssignment.difficulty || ''
      });
      
      const restoredDefects = selectedAssignment.selectedDefects
        .map(id => {
          const allDefects = [...availableDefects, ...selectedDefects];
          return allDefects.find(d => d.id === id);
        })
        .filter((d): d is Defect => d !== undefined);
      
      setSelectedDefects(restoredDefects);
      setAvailableDefects(prev => prev.filter(d => !restoredDefects.some(rd => rd.id === d.id)));
      setSelectedAssignedType(selectedAssignment.assignedTo[0] || '');
      setShowTemplateForm(true);
      setShowAssignmentDetails(false);
    }
  };

  const handleCreateFromTemplate = () => {
    if (!newAssignment.topic || !newAssignment.title || !newAssignment.description) {
      alert('Заполните обязательные поля');
      return;
    }

    const newAssignmentItem: Assignment = {
      id: Date.now(),
      topic: newAssignment.topic,
      title: newAssignment.title,
      description: newAssignment.description,
      modes: newAssignment.modes,
      weather: newAssignment.weather,
      timeOfDay: newAssignment.timeOfDay,
      assignedTo: newAssignment.assignedTo,
      groups: newAssignment.groups,
      students: newAssignment.students,
      selectedDefects: selectedDefects.map(d => d.id),
      createdAt: new Date().toLocaleString(),
      difficulty: newAssignment.difficulty
    };

    setAssignments([...assignments, newAssignmentItem]);
    setShowTemplateForm(false);
    setShowAssignmentDetails(true);
    setSelectedAssignment(newAssignmentItem);
    alert('Задание успешно создано из шаблона!');
  };

  const getAssignmentsByTopic = (topic: string) => {
    return assignments.filter(a => a.topic === topic);
  };

  const getUniqueTopicsWithAssignments = () => {
    const topicsWithAssignments = new Set(assignments.map(a => a.topic));
    return topics.filter(t => topicsWithAssignments.has(t.name));
  };

  const getDefectNames = (defectIds: number[]) => {
    const allDefects = [...availableDefects, ...selectedDefects];
    return defectIds.map(id => allDefects.find(d => d.id === id)?.name).filter(Boolean).join(', ');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGenderChange = (gender: string) => {
    setFormData(prev => ({ ...prev, gender }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const result = await registerUser({
        login: formData.login,
        password: formData.password,
        surname: formData.lastName,
        name: formData.firstName,
        patronymic: formData.patronymic,
        pol: formData.gender as 'male' | 'female',
        group_name: formData.group,
        profession_name: formData.profession,
        role: false
      });
      
      if (result && result.success) {
        alert('Пользователь зарегистрирован!');
        await loadData();
        setFormData({
          login: '', password: '', lastName: '', firstName: '', 
          patronymic: '', gender: '', group: '', profession: ''
        });
        setActiveTab('all-students');
      } else {
        alert(result?.errors ? JSON.stringify(result.errors) : 'Ошибка регистрации');
      }
    } catch (error) {
      console.error('Ошибка:', error);
      alert('Ошибка при регистрации');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = (type: 'groups' | 'professions' | 'topics') => {
    setCurrentManagementType(type);
    setNewItemName('');
    setIsCreateModalOpen(true);
  };

  const handleCreateItem = async () => {
    if (!newItemName.trim()) {
      alert('Введите наименование');
      return;
    }

    try {
      let result;
      switch (currentManagementType) {
        case 'groups':
          result = await createGroup(newItemName.trim());
          break;
        case 'professions':
          result = await createProfession(newItemName.trim());
          break;
        case 'topics':
          result = await createTopic(newItemName.trim());
          break;
      }

      if (result && result.success) {
        await loadData();
        setIsCreateModalOpen(false);
        setNewItemName('');
        alert('Успешно создано!');
      } else {
        alert(result?.errors ? JSON.stringify(result.errors) : 'Ошибка создания');
      }
    } catch (error) {
      console.error('Ошибка:', error);
      alert('Ошибка при создании');
    }
  };

  const handleOpenEditModal = (item: ManagementItem) => {
    setEditingItem(item);
    setEditItemName(item.name);
    setIsEditModalOpen(true);
  };

  const handleEditItem = async () => {
    if (!editItemName.trim() || !editingItem) {
      alert('Введите наименование');
      return;
    }

    try {
      let result;
      switch (managementType) {
        case 'groups':
          result = await updateGroup(editingItem.id, editItemName.trim());
          break;
        case 'professions':
          result = await updateProfession(editingItem.id, editItemName.trim());
          break;
        case 'topics':
          result = await updateTopic(editingItem.id, editItemName.trim());
          break;
      }

      if (result && result.success) {
        await loadData();
        setIsEditModalOpen(false);
        setEditingItem(null);
        setEditItemName('');
        alert('Успешно обновлено!');
      } else {
        alert(result?.errors ? JSON.stringify(result.errors) : 'Ошибка обновления');
      }
    } catch (error) {
      console.error('Ошибка:', error);
      alert('Ошибка при обновлении');
    }
  };

  const handleOpenDeleteModal = (item: ManagementItem) => {
    setItemToDelete(item);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      let result;
      switch (managementType) {
        case 'groups':
          result = await deleteGroup(itemToDelete.id);
          break;
        case 'professions':
          result = await deleteProfession(itemToDelete.id);
          break;
        case 'topics':
          result = await deleteTopic(itemToDelete.id);
          break;
      }

      if (result && result.success) {
        await loadData();
        setIsDeleteModalOpen(false);
        setItemToDelete(null);
        alert('Успешно удалено!');
      } else {
        alert('Ошибка удаления');
      }
    } catch (error) {
      console.error('Ошибка:', error);
      alert('Ошибка при удалении');
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    setItemToDelete(null);
  };

  const getTypeName = (type: 'groups' | 'professions' | 'topics') => {
    switch (type) {
      case 'groups': return 'Группа';
      case 'professions': return 'Профессия';
      case 'topics': return 'Тема';
    }
  };

  const getCurrentItems = () => {
    switch (managementType) {
      case 'groups': return groups;
      case 'professions': return professions;
      case 'topics': return topics;
    }
  };

  const groupsForFilter = ['all', ...new Set(students.map(s => s.group))];
  const professionsForFilter = ['all', ...new Set(students.map(s => s.profession))];

  const filteredStudents = students.filter(student => {
    const matchesSearch = `${student.lastName} ${student.firstName} ${student.patronymic}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesGroup = selectedGroup === 'all' || student.group === selectedGroup;
    const matchesProfession = selectedProfession === 'all' || student.profession === selectedProfession;

    return matchesSearch && matchesGroup && matchesProfession;
  });

  const renderContent = () => {
    switch (activeTab) {
      case 'all-students':
        return (
          <>
            <h2>Все ученики</h2>
            <div className="filters-panel">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Поиск по ФИО..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
              <div className="filter-group">
                <label>Группа:</label>
                <select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)} className="filter-select">
                  {groupsForFilter.map(group => (
                    <option key={group} value={group}>{group === 'all' ? 'Все группы' : group}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label>Профессия:</label>
                <select value={selectedProfession} onChange={(e) => setSelectedProfession(e.target.value)} className="filter-select">
                  {professionsForFilter.map(profession => (
                    <option key={profession} value={profession}>{profession === 'all' ? 'Все профессии' : profession}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="students-table-container">
              <table className="students-table">
                <thead>
                  <tr>
                    <th>ФИО ученика</th>
                    <th>Группа</th>
                    <th>Профессия</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student.id}>
                      <td
                        className="student-name-cell"
                        onClick={() => handleStudentClick(student, 'stats')}
                        style={{ cursor: 'pointer', color: '#b3bf76' }}
                      >
                        {`${student.lastName} ${student.firstName} ${student.patronymic}`}
                      </td>
                      <td>{student.group}</td>
                      <td>{student.profession}</td>
                      <td className="actions-cell">
                        <button
                          className="edit-student-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStudentClick(student, 'edit');
                          }}
                        >
                          Редактировать
                        </button>
                        <button
                          className="stats-student-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStudentClick(student, 'stats');
                          }}
                        >
                          Статистика
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredStudents.length === 0 && (
                    <tr>
                      <td colSpan={4} className="no-data">Ученики не найдены</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        );
      
      case 'registration':
        return (
          <>
            <h2>{selectedStudentForEdit ? 'Редактирование пользователя' : 'Регистрация пользователей'}</h2>
            {selectedStudentForEdit && (
              <div style={{ marginBottom: '20px' }}>
                <button className="back-btn" onClick={() => {
                  setSelectedStudentForEdit(null);
                  setFormData({
                    login: '', password: '', lastName: '', firstName: '', patronymic: '', gender: '', group: '', profession: ''
                  });
                  setActiveTab('all-students');
                }}>← Назад</button>
              </div>
            )}
            <form className="registration-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Логин *</label>
                  <input type="text" name="login" value={formData.login} onChange={handleInputChange} required placeholder="Введите логин" />
                </div>
                <div className="form-group">
                  <label>Пароль *</label>
                  <input type="password" name="password" value={formData.password} onChange={handleInputChange} required placeholder="Введите пароль" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Фамилия *</label>
                  <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} required placeholder="Введите фамилию" />
                </div>
                <div className="form-group">
                  <label>Имя *</label>
                  <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} required placeholder="Введите имя" />
                </div>
                <div className="form-group">
                  <label>Отчество</label>
                  <input type="text" name="patronymic" value={formData.patronymic} onChange={handleInputChange} placeholder="Введите отчество" />
                </div>
              </div>
              <div className="form-group">
                <label>Пол *</label>
                <div className="gender-group">
                  <label className="gender-option">
                    <input type="radio" name="gender" value="male" checked={formData.gender === 'male'} onChange={() => handleGenderChange('male')} />
                    <span>Мужской</span>
                  </label>
                  <label className="gender-option">
                    <input type="radio" name="gender" value="female" checked={formData.gender === 'female'} onChange={() => handleGenderChange('female')} />
                    <span>Женский</span>
                  </label>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Группа *</label>
                  <select name="group" value={formData.group} onChange={handleInputChange} required>
                    <option value="">Выберите группу</option>
                    {groupOptions.map(group => (<option key={group} value={group}>{group}</option>))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Профессия *</label>
                  <select name="profession" value={formData.profession} onChange={handleInputChange} required>
                    <option value="">Выберите профессию</option>
                    {professionOptions.map(profession => (<option key={profession} value={profession}>{profession}</option>))}
                  </select>
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? 'Загрузка...' : (selectedStudentForEdit ? 'Обновить' : 'Зарегистрировать')}
                </button>
                {!selectedStudentForEdit && (
                  <button type="button" className="reset-btn" onClick={() => setFormData({
                    login: '', password: '', lastName: '', firstName: '', patronymic: '', gender: '', group: '', profession: ''
                  })}>Очистить</button>
                )}
              </div>
            </form>
          </>
        );
      
      case 'statistics':
        return (
          <>
            <h2>{selectedStudentForStats ? `Статистика: ${selectedStudentForStats.lastName} ${selectedStudentForStats.firstName}` : 'Статистика прохождения уроков'}</h2>
            {selectedStudentForStats && (
              <div style={{ marginBottom: '20px' }}>
                <button className="back-btn" onClick={() => {
                  setSelectedStudentForStats(null);
                  setActiveTab('all-students');
                }}>← Назад</button>
              </div>
            )}
            <div className="statistics-table-container">
              <table className="statistics-table">
                <thead>
                  <tr>
                    <th>Дата</th>
                    <th>Тема</th>
                    <th>Название</th>
                    <th>Режим</th>
                    <th>Оценка</th>
                    <th>Тип вагона</th>
                    <th>Неисправности</th>
                    <th>Комментарий</th>
                  </tr>
                </thead>
                <tbody>
                  {statisticsData.map((stat) => (
                    <tr key={stat.id}>
                      <td>{stat.date}</td>
                      <td>{stat.theme}</td>
                      <td>{stat.title}</td>
                      <td>{stat.mode}</td>
                      <td>{stat.grade}</td>
                      <td>{stat.wagonType}</td>
                      <td className="defects-cell">{renderDefects(stat.defects)}</td>
                      <td className="comment-cell">{stat.comment || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        );
      
      case 'management':
        return (
          <>
            <h2>Управление группами и профессиями</h2>
            <div className="management-buttons">
              <button className={`management-type-btn ${managementType === 'groups' ? 'active' : ''}`} onClick={() => setManagementType('groups')}>Группы</button>
              <button className={`management-type-btn ${managementType === 'professions' ? 'active' : ''}`} onClick={() => setManagementType('professions')}>Профессии</button>
              <button className={`management-type-btn ${managementType === 'topics' ? 'active' : ''}`} onClick={() => setManagementType('topics')}>Темы</button>
              <button className="create-btn" onClick={() => handleOpenCreateModal(managementType)}>+ Создать</button>
            </div>
            <div className="management-list">
              {getCurrentItems().map(item => (
                <div key={item.id} className="management-item">
                  <span className="item-name">{item.name}</span>
                  <div className="item-actions">
                    <button className="edit-btn" onClick={() => handleOpenEditModal(item)}>Редактировать</button>
                    <button className="delete-btn" onClick={() => handleOpenDeleteModal(item)}>Удалить</button>
                  </div>
                </div>
              ))}
            </div>
            
            {isCreateModalOpen && (
              <div className="modal-overlay" onClick={() => setIsCreateModalOpen(false)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <h3>Создание {getTypeName(currentManagementType)}</h3>
                  <div className="modal-form-group">
                    <label>Наименование</label>
                    <input type="text" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} placeholder="Введите наименование" autoFocus />
                  </div>
                  <div className="modal-actions">
                    <button className="modal-submit-btn" onClick={handleCreateItem}>Создать</button>
                    <button className="modal-cancel-btn" onClick={() => setIsCreateModalOpen(false)}>Отмена</button>
                  </div>
                </div>
              </div>
            )}
            
            {isEditModalOpen && editingItem && (
              <div className="modal-overlay" onClick={() => setIsEditModalOpen(false)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <h3>Редактирование {getTypeName(managementType)}</h3>
                  <div className="modal-form-group">
                    <label>Наименование</label>
                    <input type="text" value={editItemName} onChange={(e) => setEditItemName(e.target.value)} placeholder="Введите наименование" autoFocus />
                  </div>
                  <div className="modal-actions">
                    <button className="modal-submit-btn" onClick={handleEditItem}>Сохранить</button>
                    <button className="modal-cancel-btn" onClick={() => setIsEditModalOpen(false)}>Отмена</button>
                  </div>
                </div>
              </div>
            )}
            
            {isDeleteModalOpen && itemToDelete && (
              <div className="modal-overlay" onClick={handleCancelDelete}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <h3>Подтверждение удаления</h3>
                  <p>Вы уверены, что хотите удалить "{itemToDelete.name}"?</p>
                  <div className="modal-actions">
                    <button className="modal-submit-btn" onClick={handleConfirmDelete}>Удалить</button>
                    <button className="modal-cancel-btn" onClick={handleCancelDelete}>Отмена</button>
                  </div>
                </div>
              </div>
            )}
          </>
        );
      
      case 'assignments':
        return (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2>Управление заданиями</h2>
              <button className="create-btn" onClick={handleOpenCreateForm}>+ Создать задание</button>
            </div>

            {showCreateForm && (
              <div className="create-assignment-form">
                <h3>Создание нового задания</h3>
                <div className="form-group">
                  <label>Тема *</label>
                  <select value={newAssignment.topic} onChange={(e) => setNewAssignment({ ...newAssignment, topic: e.target.value })}>
                    <option value="">Выберите тему</option>
                    {topicOptions.map(topic => (<option key={topic} value={topic}>{topic}</option>))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Название *</label>
                  <input type="text" value={newAssignment.title} onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })} placeholder="Введите название задания" />
                </div>

                <div className="form-group">
                  <label>Описание *</label>
                  <textarea value={newAssignment.description} onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })} placeholder="Введите описание задания" rows={5} />
                </div>

                <div className="form-group">
                  <label>Режим *</label>
                  <div className="checkbox-group">
                    <label><input type="checkbox" checked={newAssignment.modes.includes('Обучение')} onChange={() => handleModeChange('Обучение')} /> Обучение</label>
                    <label><input type="checkbox" checked={newAssignment.modes.includes('Экзамен')} onChange={() => handleModeChange('Экзамен')} /> Экзамен</label>
                  </div>
                </div>

                <div className="form-actions">
                  <button className="submit-btn" onClick={handleCreateAssignment}>Создать</button>
                  <button className="reset-btn" onClick={handleBackToList}>Отмена</button>
                </div>
              </div>
            )}

            {!showCreateForm && !showTemplateForm && (
              <>
                {assignments.length === 0 ? (
                  <div className="no-assignments">
                    <p>Нет созданных заданий. Нажмите кнопку "Создать задание" чтобы добавить первое задание.</p>
                  </div>
                ) : (
                  <div className="assignments-list">
                    {assignments.map(assignment => (
                      <div key={assignment.id} className="assignment-card">
                        <h4>{assignment.title}</h4>
                        <p>{assignment.description}</p>
                        <button onClick={() => handleViewAssignment(assignment)}>Подробнее</button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {showAssignmentDetails && selectedAssignment && (
              <div>
                <button onClick={handleBackToList}>← Назад</button>
                <h2>{selectedAssignment.title}</h2>
                <p>{selectedAssignment.description}</p>
                <button onClick={handleEditAssignment}>Редактировать</button>
                <button onClick={handleDeleteAssignment}>Удалить</button>
              </div>
            )}
          </>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="teacher-page">
      <div className="teacher-work-area">
        {renderContent()}
      </div>

      <div className="teacher-sidebar">
        <div className="menu-buttons">
          <button className={`menu-btn ${activeTab === 'all-students' ? 'active' : ''}`} onClick={() => setActiveTab('all-students')}>
            Все ученики
          </button>
          <button className={`menu-btn ${activeTab === 'registration' ? 'active' : ''}`} onClick={() => setActiveTab('registration')}>
            Регистрация
          </button>
          <button className={`menu-btn ${activeTab === 'management' ? 'active' : ''}`} onClick={() => setActiveTab('management')}>
            Управление
          </button>
          <button className={`menu-btn ${activeTab === 'assignments' ? 'active' : ''}`} onClick={() => setActiveTab('assignments')}>
            Задания
          </button>
          <button className="menu-btn" onClick={onBack}>Выход</button>
        </div>
      </div>
    </div>
  );
};

export default TeacherProfile;