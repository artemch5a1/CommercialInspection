import { useState, useEffect } from 'react';
import { getCurrentUser } from '../services/api';
import {
  getUsers, registerUser,
  getGroups, createGroup, updateGroup, deleteGroup,
  getProfessions, createProfession, updateProfession, deleteProfession,
  getTopics, createTopic, updateTopic, deleteTopic
} from '../services/api';
import CryptoJS from 'crypto-js';

const generateSecurePassword = (length: number = 10): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  const randomBytes = CryptoJS.lib.WordArray.random(length);
  const randomArray = new Uint8Array(randomBytes.words.length * 4);

  for (let i = 0; i < randomBytes.words.length; i++) {
    randomArray[i * 4] = (randomBytes.words[i] >> 24) & 0xff;
    randomArray[i * 4 + 1] = (randomBytes.words[i] >> 16) & 0xff;
    randomArray[i * 4 + 2] = (randomBytes.words[i] >> 8) & 0xff;
    randomArray[i * 4 + 3] = randomBytes.words[i] & 0xff;
  }

  for (let i = 0; i < length; i++) {
    password += chars[randomArray[i] % chars.length];
  }

  return password;
};

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

interface TypesWagon {
  id: number;
  name: string;
}

interface MalfunctionData {
  id: number;
  name: string;
  types_wagon_id: number;
  types_wagon?: TypesWagon;
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
  level?: string; // Добавлено поле уровня
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

interface FormErrors {
  login?: string;
  password?: string;
  lastName?: string;
  firstName?: string;
  patronymic?: string;
  gender?: string;
  group?: string;
  profession?: string;
  general?: string;
}

interface ManagementItem {
  id: number;
  name: string;
}

interface Defect {
  id: number;
  name: string;
  description: string;
  types_wagon_id?: number;
  wagonTypeName?: string;
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
  access?: string;
  group_id?: number;
  user_id?: number;
  level?: string; // Добавлено поле уровня
}

interface LessonStats {
  id: number;
  date: string;
  theme: string;
  title: string;
  mode: string;
  grade: number;
  wagonType: string;
  defects: { name: string; status?: string; comment?: string }[];
  comment: string;
}

interface AssignmentFormErrors {
  topicId?: string;
  title?: string;
  description?: string;
  modes?: string;
  assignedTo?: string;
  group?: string;
  student?: string;
  general?: string;
}

interface ManagementFormErrors {
  name?: string;
  general?: string;
}

const TeacherProfile = ({ onBack }: TeacherProfileProps) => {
  const [activeTab, setActiveTab] = useState<'all-students' | 'registration' | 'management' | 'assignments' | 'statistics'>('all-students');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [showAssignmentDetails, setShowAssignmentDetails] = useState(false);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [selectedStudentForEdit, setSelectedStudentForEdit] = useState<Student | null>(null);
  const [selectedStudentForStats, setSelectedStudentForStats] = useState<Student | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [executingAssignment, setExecutingAssignment] = useState<Assignment | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [selectedGroups, setSelectedGroups] = useState<string[]>(['all']);
  const [selectedProfessions, setSelectedProfessions] = useState<string[]>(['all']);
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);
  const [showProfessionDropdown, setShowProfessionDropdown] = useState(false);
  const [availableGroups, setAvailableGroups] = useState<string[]>(['all']);
  const [availableProfessions, setAvailableProfessions] = useState<string[]>(['all']);

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

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [assignmentErrors, setAssignmentErrors] = useState<AssignmentFormErrors>({});
  const [managementErrors, setManagementErrors] = useState<ManagementFormErrors>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  const [managementType, setManagementType] = useState<'groups' | 'professions' | 'topics'>('groups');
  const [groups, setGroups] = useState<ManagementItem[]>([]);
  const [professions, setProfessions] = useState<ManagementItem[]>([]);
  const [topics, setTopics] = useState<ManagementItem[]>([]);

  const [typesWagons, setTypesWagons] = useState<TypesWagon[]>([]);
  const [malfunctionsFromDB, setMalfunctionsFromDB] = useState<MalfunctionData[]>([]);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [currentManagementType, setCurrentManagementType] = useState<'groups' | 'professions' | 'topics'>('groups');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ManagementItem | null>(null);
  const [editItemName, setEditItemName] = useState('');

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ManagementItem | null>(null);

  const [newAssignment, setNewAssignment] = useState({
    topicId: 0,
    topicName: '',
    title: '',
    description: '',
    modes: [] as string[],
    weather: '',
    timeOfDay: '',
    assignedTo: [] as string[],
    groups: [] as string[],
    students: [] as number[],
    selectedDefects: [] as number[],
    difficulty: '',
    level: '' // Добавлено поле уровня
  });
  const [selectedAssignedType, setSelectedAssignedType] = useState<string>('');

  const [availableDefects, setAvailableDefects] = useState<Defect[]>([]);
  const [selectedDefects, setSelectedDefects] = useState<Defect[]>([]);

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [existingLogins, setExistingLogins] = useState<Set<string>>(new Set());

  // Состояния для статистики
  const [teacherExpandedStat, setTeacherExpandedStat] = useState<number | null>(null);
  const [teacherStatisticsData, setTeacherStatisticsData] = useState<LessonStats[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);

  const groupOptions = groups.map(g => g.name);
  const professionOptions = professions.map(p => p.name);
  const topicOptions = topics.map(t => t.name);
  const weatherOptions = ['Ясно', 'Облачно', 'Дождь', 'Туман'];
  const timeOptions = ['Утро', 'День', 'Вечер', 'Ночь'];
  const difficultyOptions = ['Низкий', 'Средний', 'Высокий'];
  const levelOptions = [
    { value: 'beginner', label: 'Начальный' },
    { value: 'simple', label: 'Простой' },
    { value: 'medium', label: 'Средний' },
    { value: 'hard', label: 'Сложный' },
    { value: 'maximum', label: 'Максимальный' },
    { value: 'expert', label: 'Эксперт' }
  ];

  // ... (все функции валидации остаются без изменений) ...
  const validateLogin = (login: string, isEdit: boolean = false): string | undefined => {
    if (!login.trim()) return 'Логин обязателен для заполнения';
    if (login.length < 3) return 'Логин должен содержать минимум 3 символа';
    if (login.length > 50) return 'Логин не должен превышать 50 символов';
    if (!/^[\p{L}0-9_]+$/u.test(login)) return 'Логин может содержать только буквы, цифры и знак подчеркивания';
    if (!isEdit && existingLogins.has(login.toLowerCase())) return 'Этот логин уже занят';
    if (isEdit && selectedStudentForEdit) {
      const otherLogins = Array.from(existingLogins).filter(l => l !== selectedStudentForEdit.login?.toLowerCase());
      if (otherLogins.includes(login.toLowerCase())) return 'Этот логин уже занят другим пользователем';
    }
    return undefined;
  };

  const validatePassword = (password: string, isEdit: boolean = false): string | undefined => {
    if (!isEdit && !password) return 'Пароль обязателен для заполнения';
    if (password && password.length < 6) return 'Пароль должен содержать минимум 6 символов';
    if (password && password.length > 50) return 'Пароль не должен превышать 50 символов';
    return undefined;
  };

  const validateLastName = (lastName: string): string | undefined => {
    if (!lastName.trim()) return 'Фамилия обязательна для заполнения';
    if (lastName.length < 2) return 'Фамилия должна содержать минимум 2 символа';
    if (lastName.length > 50) return 'Фамилия не должна превышать 50 символов';
    if (!/^[а-яА-ЯёЁ\-]+$/.test(lastName)) return 'Фамилия должна содержать только русские буквы и дефис';
    return undefined;
  };

  const validateFirstName = (firstName: string): string | undefined => {
    if (!firstName.trim()) return 'Имя обязательно для заполнения';
    if (firstName.length < 2) return 'Имя должно содержать минимум 2 символа';
    if (firstName.length > 50) return 'Имя не должно превышать 50 символов';
    if (!/^[а-яА-ЯёЁ\-]+$/.test(firstName)) return 'Имя должно содержать только русские буквы и дефис';
    return undefined;
  };

  const validatePatronymic = (patronymic: string): string | undefined => {
    if (patronymic && patronymic.length > 50) return 'Отчество не должно превышать 50 символов';
    if (patronymic && !/^[а-яА-ЯёЁ\-]+$/.test(patronymic)) return 'Отчество должно содержать только русские буквы и дефис';
    return undefined;
  };

  const validateGender = (gender: string): string | undefined => {
    if (!gender) return 'Пол обязателен для выбора';
    return undefined;
  };

  const validateGroup = (group: string): string | undefined => {
    if (!group) return 'Группа обязательна для выбора';
    return undefined;
  };

  const validateProfession = (profession: string): string | undefined => {
    if (!profession) return 'Профессия обязательна для выбора';
    return undefined;
  };

  const validateAssignmentTopic = (topicId: number): string | undefined => {
    if (!topicId) return 'Тема обязательна для выбора';
    return undefined;
  };

  const validateAssignmentTitle = (title: string): string | undefined => {
    if (!title.trim()) return 'Название задания обязательно для заполнения';
    if (title.length < 3) return 'Название должно содержать минимум 3 символа';
    if (title.length > 100) return 'Название не должно превышать 100 символов';
    return undefined;
  };

  const validateAssignmentDescription = (description: string): string | undefined => {
    if (!description.trim()) return 'Описание задания обязательно для заполнения';
    if (description.length < 10) return 'Описание должно содержать минимум 10 символов';
    return undefined;
  };

  const validateAssignmentModes = (modes: string[]): string | undefined => {
    if (modes.length === 0) return 'Выберите хотя бы один режим';
    return undefined;
  };

  const validateAssignedTo = (assignedTo: string[], selectedGroup?: string, selectedStudent?: number): string | undefined => {
    if (assignedTo.length === 0) return 'Выберите кому назначено задание';
    if (assignedTo.includes('group') && !selectedGroup) return 'Выберите группу';
    if (assignedTo.includes('student') && !selectedStudent) return 'Выберите ученика';
    return undefined;
  };

  const validateManagementName = (name: string): string | undefined => {
    if (!name.trim()) return 'Наименование обязательно для заполнения';
    if (name.length < 2) return 'Наименование должно содержать минимум 2 символа';
    if (name.length > 50) return 'Наименование не должно превышать 50 символов';
    return undefined;
  };

  const validateForm = (isEdit: boolean = false): boolean => {
    const errors: FormErrors = {};
    errors.login = validateLogin(formData.login, isEdit);
    errors.password = validatePassword(formData.password, isEdit);
    errors.lastName = validateLastName(formData.lastName);
    errors.firstName = validateFirstName(formData.firstName);
    errors.patronymic = validatePatronymic(formData.patronymic);
    errors.gender = validateGender(formData.gender);
    errors.group = validateGroup(formData.group);
    errors.profession = validateProfession(formData.profession);
    setFormErrors(errors);
    return !Object.values(errors).some(error => error !== undefined);
  };

  const validateAssignmentForm = (): boolean => {
    const errors: AssignmentFormErrors = {};
    errors.topicId = validateAssignmentTopic(newAssignment.topicId);
    errors.title = validateAssignmentTitle(newAssignment.title);
    errors.description = validateAssignmentDescription(newAssignment.description);
    errors.modes = validateAssignmentModes(newAssignment.modes);
    errors.assignedTo = validateAssignedTo(
      newAssignment.assignedTo,
      newAssignment.groups[0],
      newAssignment.students[0]
    );
    setAssignmentErrors(errors);
    return !Object.values(errors).some(error => error !== undefined);
  };

  const validateManagementForm = (name: string): boolean => {
    const errors: ManagementFormErrors = {};
    errors.name = validateManagementName(name);
    setManagementErrors(errors);
    return !errors.name;
  };

  const handleFieldBlur = (fieldName: string) => {
    setTouchedFields(prev => new Set(prev).add(fieldName));
    const errors: FormErrors = { ...formErrors };
    const isEdit = !!selectedStudentForEdit;
    switch (fieldName) {
      case 'login': errors.login = validateLogin(formData.login, isEdit); break;
      case 'password': errors.password = validatePassword(formData.password, isEdit); break;
      case 'lastName': errors.lastName = validateLastName(formData.lastName); break;
      case 'firstName': errors.firstName = validateFirstName(formData.firstName); break;
      case 'patronymic': errors.patronymic = validatePatronymic(formData.patronymic); break;
      case 'gender': errors.gender = validateGender(formData.gender); break;
      case 'group': errors.group = validateGroup(formData.group); break;
      case 'profession': errors.profession = validateProfession(formData.profession); break;
    }
    setFormErrors(errors);
  };

  const shouldShowError = (fieldName: string): boolean => {
    return touchedFields.has(fieldName);
  };

  useEffect(() => {
    const loadStudentStatistics = async () => {
      if (selectedStudentForStats) {
        setStatsLoading(true);
        try {
          const response = await fetch(`/api/statistics/user/${selectedStudentForStats.id}`);
          const data = await response.json();
          if (data.success) {
            setTeacherStatisticsData(data.statistics || []);
          }
        } catch (error) {
          console.error('Ошибка загрузки статистики:', error);
        } finally {
          setStatsLoading(false);
        }
      }
    };
    loadStudentStatistics();
  }, [selectedStudentForStats]);

  const handleGroupToggle = (group: string) => {
    if (group === 'all') {
      setSelectedGroups(['all']);
    } else {
      setSelectedGroups(prev => {
        const newSelection = prev.filter(g => g !== 'all');
        if (newSelection.includes(group)) {
          const filtered = newSelection.filter(g => g !== group);
          return filtered.length === 0 ? ['all'] : filtered;
        } else {
          return [...newSelection, group];
        }
      });
    }
  };

  const handleProfessionToggle = (profession: string) => {
    if (profession === 'all') {
      setSelectedProfessions(['all']);
    } else {
      setSelectedProfessions(prev => {
        const newSelection = prev.filter(p => p !== 'all');
        if (newSelection.includes(profession)) {
          const filtered = newSelection.filter(p => p !== profession);
          return filtered.length === 0 ? ['all'] : filtered;
        } else {
          return [...newSelection, profession];
        }
      });
    }
  };

  const clearAllFilters = () => {
    setSelectedGroups(['all']);
    setSelectedProfessions(['all']);
    setSearchTerm('');
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = `${student.lastName} ${student.firstName} ${student.patronymic}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    let matchesGroup = true;
    if (!selectedGroups.includes('all') && selectedGroups.length > 0) {
      matchesGroup = selectedGroups.includes(student.group);
    }
    let matchesProfession = true;
    if (!selectedProfessions.includes('all') && selectedProfessions.length > 0) {
      matchesProfession = selectedProfessions.includes(student.profession);
    }
    return matchesSearch && matchesGroup && matchesProfession;
  });

  const loadTypesWagonsAndMalfunctions = async () => {
    try {
      const wagonsResponse = await fetch('/api/types-wagons');
      const wagonsData = await wagonsResponse.json();
      if (wagonsData.success) {
        setTypesWagons(wagonsData.types_wagons);
      }
      const malfunctionsResponse = await fetch('/api/malfunctions');
      const malfunctionsData = await malfunctionsResponse.json();
      if (malfunctionsData.success) {
        setMalfunctionsFromDB(malfunctionsData.malfunctions);
        const defectsWithWagonType = malfunctionsData.malfunctions.map((m: any) => {
          const wagonType = wagonsData.types_wagons?.find((w: any) => w.id === m.types_wagon_id);
          return {
            id: m.id,
            name: m.name,
            description: m.name,
            types_wagon_id: m.types_wagon_id,
            wagonTypeName: wagonType?.name || ''
          };
        });
        setAvailableDefects(defectsWithWagonType);
      }
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    }
  };

  const loadAssignments = async () => {
    try {
      const response = await fetch('/api/tasks');
      const data = await response.json();
      if (data.success) {
        const loadedAssignments = data.tasks.map((task: any) => ({
          id: task.id,
          topic: task.topic?.name || 'Без темы',
          title: task.name,
          description: task.description,
          modes: task.training_mode ? task.training_mode.split(', ') : [],
          weather: task.weather_conditions || '',
          timeOfDay: task.times_day || '',
          assignedTo: task.access === 'all' ? ['all'] : (task.access === 'group' ? ['group'] : ['student']),
          groups: [],
          students: [],
          selectedDefects: task.task_malfunctions?.map((tm: any) => tm.malfunction_id) || [],
          createdAt: new Date(task.created_at).toLocaleString(),
          difficulty: 'Средний',
          level: task.level || 'simple', // Добавляем уровень из БД
          access: task.access,
          group_id: task.group_id,
          user_id: task.user_id
        }));
        setAssignments(loadedAssignments);
      }
    } catch (error) {
      console.error('Ошибка загрузки заданий:', error);
    }
  };

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
        const studentsOnly = usersData.filter((user: any) => user.role === false || user.role === 0);
        const convertedStudents = studentsOnly.map((user: any) => ({
          id: user.id,
          lastName: user.surname,
          firstName: user.name,
          patronymic: user.patronymic || '',
          group: user.group?.name || '',
          profession: user.profession?.name || '',
          login: user.login,
          gender: user.pol,
          level: user.level || 'simple' // Добавляем уровень из БД
        }));
        setStudents(convertedStudents);
        setExistingLogins(new Set(convertedStudents.map(s => s.login?.toLowerCase() || '')));
      }

      await loadTypesWagonsAndMalfunctions();
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    }
  };

  useEffect(() => {
    loadData();
    loadAssignments();
  }, []);

  useEffect(() => {
    const groupsList = ['all', ...new Set(students.map(s => s.group).filter(Boolean))];
    const professionsList = ['all', ...new Set(students.map(s => s.profession).filter(Boolean))];
    setAvailableGroups(groupsList);
    setAvailableProfessions(professionsList);
  }, [students]);

  const resetAssignmentForm = () => {
    setNewAssignment({
      topicId: 0,
      topicName: '',
      title: '',
      description: '',
      modes: [],
      weather: '',
      timeOfDay: '',
      assignedTo: [],
      groups: [],
      students: [],
      selectedDefects: [],
      difficulty: '',
      level: ''
    });
    setSelectedDefects([]);
    setSelectedAssignedType('');
    setAssignmentErrors({});
  };

  const handleStudentClick = (student: Student, action: 'edit' | 'stats') => {
    if (action === 'edit') {
      setSelectedStudentForEdit(student);
      setFormData({
        login: student.login || '',
        password: '',
        lastName: student.lastName,
        firstName: student.firstName,
        patronymic: student.patronymic,
        gender: student.gender || '',
        group: student.group,
        profession: student.profession
      });
      setShowPassword(false);
      setFormErrors({});
      setTouchedFields(new Set());
      setActiveTab('registration');
    } else if (action === 'stats') {
      setSelectedStudentForStats(student);
      setActiveTab('statistics');
    }
  };

  const handleDeleteStudent = async (student: Student) => {
    if (confirm(`Вы уверены, что хотите удалить ученика ${student.lastName} ${student.firstName}?`)) {
      try {
        const response = await fetch(`/api/users/${student.id}`, { method: 'DELETE' });
        const result = await response.json();
        if (result.success) {
          alert('Ученик успешно удален!');
          await loadData();
        } else {
          alert('Ошибка при удалении ученика');
        }
      } catch (error) {
        console.error('Ошибка:', error);
        alert('Ошибка при удалении ученика');
      }
    }
  };

  const handleGeneratePassword = () => {
    const newPassword = generateSecurePassword(10);
    setGeneratedPassword(newPassword);
    setFormData(prev => ({ ...prev, password: newPassword }));
    setShowPassword(true);
  };

  const handleOpenCreateForm = () => {
    resetAssignmentForm();
    const defectsFromDB = malfunctionsFromDB.map((m) => {
      const wagonType = typesWagons.find(w => w.id === m.types_wagon_id);
      return {
        id: m.id,
        name: m.name,
        description: m.name,
        types_wagon_id: m.types_wagon_id,
        wagonTypeName: wagonType?.name || ''
      };
    });
    setAvailableDefects(defectsFromDB);
    setShowCreateForm(true);
    setShowAssignmentDetails(false);
    setShowTemplateForm(false);
    setSelectedAssignment(null);
  };

  const handleModeChange = (mode: string) => {
    setNewAssignment(prev => ({
      ...prev,
      modes: prev.modes.includes(mode)
        ? prev.modes.filter(m => m !== mode)
        : [...prev.modes, mode]
    }));
    setAssignmentErrors(prev => ({ ...prev, modes: undefined }));
  };

  const handleAssignedToChange = (type: string) => {
    setSelectedAssignedType(type);
    setNewAssignment(prev => ({
      ...prev,
      assignedTo: [type],
      groups: [],
      students: []
    }));
    setAssignmentErrors(prev => ({ ...prev, assignedTo: undefined, group: undefined, student: undefined }));
  };

  const handleAddDefect = (defect: Defect) => {
    setAvailableDefects(availableDefects.filter(d => d.id !== defect.id));
    setSelectedDefects([...selectedDefects, defect]);
  };

  const handleRemoveDefect = (defect: Defect) => {
    setSelectedDefects(selectedDefects.filter(d => d.id !== defect.id));
    setAvailableDefects([...availableDefects, defect].sort((a, b) => a.id - b.id));
  };

  const handleCreateAssignment = async () => {
    if (!validateAssignmentForm()) {
      alert('Пожалуйста, исправьте ошибки в форме');
      return;
    }

    let access = 'all';
    let userId = null;
    let groupId = null;

    if (selectedAssignedType === 'student') {
      access = 'user';
      userId = newAssignment.students[0] || null;
    } else if (selectedAssignedType === 'group') {
      access = 'group';
      const selectedGroupName = newAssignment.groups[0];
      const foundGroup = groups.find(g => g.name === selectedGroupName);
      groupId = foundGroup?.id || null;
    }

    const taskData = {
      name: newAssignment.title,
      description: newAssignment.description,
      training_mode: newAssignment.modes.join(', '),
      weather_conditions: newAssignment.weather,
      times_day: newAssignment.timeOfDay,
      topic_id: newAssignment.topicId,
      level: newAssignment.level || 'simple', // Добавляем уровень
      access: access,
      user_id: userId,
      group_id: groupId,
      selected_defects: selectedDefects.map(d => d.id)
    };

    try {
      setLoading(true);
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      });
      const result = await response.json();

      if (result.success) {
        await loadAssignments();
        setShowCreateForm(false);
        alert('Задание успешно создано!');
        resetAssignmentForm();
        setSelectedAssignedType('');
      } else {
        setAssignmentErrors({ general: result.error || 'Ошибка при создании задания' });
      }
    } catch (error) {
      console.error('Ошибка:', error);
      setAssignmentErrors({ general: 'Ошибка при создании задания' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAssignment = async () => {
    if (!selectedAssignment) {
      alert('Задание не выбрано для редактирования');
      return;
    }

    if (!validateAssignmentForm()) {
      alert('Пожалуйста, исправьте ошибки в форме');
      return;
    }

    let access = 'all';
    let userId = null;
    let groupId = null;

    if (selectedAssignedType === 'student') {
      access = 'user';
      userId = newAssignment.students[0] || null;
    } else if (selectedAssignedType === 'group') {
      access = 'group';
      const selectedGroupName = newAssignment.groups[0];
      const foundGroup = groups.find(g => g.name === selectedGroupName);
      groupId = foundGroup?.id || null;
    }

    const taskData = {
      name: newAssignment.title,
      description: newAssignment.description,
      training_mode: newAssignment.modes.join(', '),
      weather_conditions: newAssignment.weather,
      times_day: newAssignment.timeOfDay,
      topic_id: newAssignment.topicId,
      level: newAssignment.level || 'simple', // Добавляем уровень
      access: access,
      user_id: userId,
      group_id: groupId,
      selected_defects: selectedDefects.map(d => d.id)
    };

    try {
      setLoading(true);
      const response = await fetch(`/api/tasks/${selectedAssignment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      });
      const result = await response.json();
      if (result.success) {
        await loadAssignments();
        setShowCreateForm(false);
        setSelectedAssignment(null);
        alert('Задание успешно обновлено!');
        resetAssignmentForm();
        setSelectedAssignedType('');
      } else {
        setAssignmentErrors({ general: result.error || 'Ошибка при обновлении задания' });
      }
    } catch (error) {
      console.error('Ошибка:', error);
      setAssignmentErrors({ general: 'Ошибка при обновлении задания' });
    } finally {
      setLoading(false);
    }
  };

  const handleViewAssignment = (assignment: Assignment) => {
    setExecutingAssignment(assignment);
  };

  const handleExitExecution = () => {
    setExecutingAssignment(null);
  };

  const handleEditAssignment = async (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    await loadTypesWagonsAndMalfunctions();

    const foundTopic = topics.find(t => t.name === assignment.topic);
    let assignedType = 'all';
    let selectedGroup = '';
    let selectedStudentId = null;

    try {
      const response = await fetch(`/api/tasks/${assignment.id}`);
      const data = await response.json();
      if (data.success && data.task) {
        const task = data.task;
        if (task.access === 'group') {
          assignedType = 'group';
          const group = groups.find(g => g.id === task.group_id);
          selectedGroup = group?.name || '';
        } else if (task.access === 'user') {
          assignedType = 'student';
          selectedStudentId = task.user_id;
        } else {
          assignedType = 'all';
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки деталей задания:', error);
    }

    setNewAssignment({
      topicId: foundTopic?.id || 0,
      topicName: assignment.topic,
      title: assignment.title,
      description: assignment.description,
      modes: assignment.modes,
      weather: assignment.weather,
      timeOfDay: assignment.timeOfDay,
      assignedTo: [assignedType],
      groups: selectedGroup ? [selectedGroup] : [],
      students: selectedStudentId ? [selectedStudentId] : [],
      selectedDefects: assignment.selectedDefects,
      difficulty: assignment.difficulty || '',
      level: assignment.level || 'simple' // Добавляем уровень
    });

    setSelectedAssignedType(assignedType);
    setAssignmentErrors({});

    setTimeout(() => {
      const allDefects = [...availableDefects];
      const restoredDefects = assignment.selectedDefects
        .map(id => allDefects.find(d => d.id === id))
        .filter((d): d is Defect => d !== undefined);
      setSelectedDefects(restoredDefects);
      const remainingDefects = allDefects.filter(
        d => !restoredDefects.some(rd => rd.id === d.id)
      );
      setAvailableDefects(remainingDefects);
    }, 100);

    setShowCreateForm(true);
    setShowTemplateForm(false);
  };

  const handleDeleteAssignment = async (assignmentId?: number) => {
    const idToDelete = assignmentId || selectedAssignment?.id || executingAssignment?.id;
    if (!idToDelete) {
      alert('Задание не выбрано для удаления');
      return;
    }
    if (confirm('Вы уверены, что хотите удалить это задание?')) {
      try {
        const response = await fetch(`/api/tasks/${idToDelete}`, { method: 'DELETE' });
        const result = await response.json();
        if (result.success) {
          await loadAssignments();
          setShowAssignmentDetails(false);
          setSelectedAssignment(null);
          setExecutingAssignment(null);
          alert('Задание удалено!');
        } else {
          alert('Ошибка при удалении задания');
        }
      } catch (error) {
        console.error('Ошибка:', error);
        alert('Ошибка при удалении задания');
      }
    }
  };

  const handleCreateTemplate = (assignment: Assignment) => {
    setSelectedAssignment(null);
    setNewAssignment({
      topicId: topics.find(t => t.name === assignment.topic)?.id || 0,
      topicName: assignment.topic,
      title: assignment.title,
      description: assignment.description,
      modes: assignment.modes,
      weather: assignment.weather,
      timeOfDay: assignment.timeOfDay,
      assignedTo: assignment.assignedTo,
      groups: assignment.groups,
      students: assignment.students,
      selectedDefects: assignment.selectedDefects,
      difficulty: assignment.difficulty || '',
      level: assignment.level || 'simple' // Добавляем уровень
    });

    const allDefects = [...availableDefects, ...selectedDefects];
    const restoredDefects = assignment.selectedDefects
      .map(id => allDefects.find(d => d.id === id))
      .filter((d): d is Defect => d !== undefined);
    setSelectedDefects(restoredDefects);
    setSelectedAssignedType(assignment.assignedTo[0] || '');
    setAssignmentErrors({});
    setShowTemplateForm(true);
    setShowCreateForm(false);
  };

  const handleCreateFromTemplate = async () => {
    if (!validateAssignmentForm()) {
      alert('Пожалуйста, исправьте ошибки в форме');
      return;
    }

    let access = 'all';
    let userId = null;
    let groupId = null;

    if (selectedAssignedType === 'student') {
      access = 'user';
      userId = newAssignment.students[0] || null;
    } else if (selectedAssignedType === 'group') {
      access = 'group';
      const selectedGroupName = newAssignment.groups[0];
      const foundGroup = groups.find(g => g.name === selectedGroupName);
      groupId = foundGroup?.id || null;
    }

    const taskData = {
      name: newAssignment.title,
      description: newAssignment.description,
      training_mode: newAssignment.modes.join(', '),
      weather_conditions: newAssignment.weather,
      times_day: newAssignment.timeOfDay,
      topic_id: newAssignment.topicId,
      level: newAssignment.level || 'simple', // Добавляем уровень
      access: access,
      user_id: userId,
      group_id: groupId,
      selected_defects: selectedDefects.map(d => d.id)
    };

    try {
      setLoading(true);
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      });
      const result = await response.json();
      if (result.success) {
        await loadAssignments();
        setShowTemplateForm(false);
        resetAssignmentForm();
        alert('Задание успешно создано из шаблона!');
      } else {
        setAssignmentErrors({ general: result.error || 'Ошибка при создании задания' });
      }
    } catch (error) {
      console.error('Ошибка:', error);
      setAssignmentErrors({ general: 'Ошибка при создании задания' });
    } finally {
      setLoading(false);
    }
  };

  const getAssignmentsByTopic = (topic: string) => {
    return assignments.filter(a => a.topic === topic);
  };

  const getUniqueTopicsWithAssignments = () => {
    const topicsWithAssignments = new Set(assignments.map(a => a.topic));
    return topics.filter(t => topicsWithAssignments.has(t.name));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (touchedFields.has(name)) {
      const errors: FormErrors = { ...formErrors };
      const isEdit = !!selectedStudentForEdit;
      switch (name) {
        case 'login': errors.login = validateLogin(value, isEdit); break;
        case 'password': errors.password = validatePassword(value, isEdit); break;
        case 'lastName': errors.lastName = validateLastName(value); break;
        case 'firstName': errors.firstName = validateFirstName(value); break;
        case 'patronymic': errors.patronymic = validatePatronymic(value); break;
        case 'group': errors.group = validateGroup(value); break;
        case 'profession': errors.profession = validateProfession(value); break;
      }
      setFormErrors(errors);
    }
  };

  const handleGenderChange = (gender: string) => {
    setFormData(prev => ({ ...prev, gender }));
    if (touchedFields.has('gender')) {
      setFormErrors(prev => ({ ...prev, gender: validateGender(gender) }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const allFields = ['login', 'password', 'lastName', 'firstName', 'patronymic', 'gender', 'group', 'profession'];
    setTouchedFields(new Set(allFields));
    const isEdit = !!selectedStudentForEdit;
    if (!validateForm(isEdit)) {
      alert('Пожалуйста, исправьте ошибки в форме');
      return;
    }
    setLoading(true);
    try {
      if (selectedStudentForEdit) {
        const updateData: any = {
          surname: formData.lastName,
          name: formData.firstName,
          patronymic: formData.patronymic,
          pol: formData.gender as 'male' | 'female',
          group_id: groups.find(g => g.name === formData.group)?.id || null,
          profession_id: professions.find(p => p.name === formData.profession)?.id || null,
        };
        if (formData.password && formData.password.trim() !== '') {
          updateData.password = formData.password;
        }
        const response = await fetch(`/api/users/${selectedStudentForEdit.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData)
        });
        const result = await response.json();
        if (result.success) {
          alert('Данные ученика обновлены!');
          await loadData();
          setFormData({ login: '', password: '', lastName: '', firstName: '', patronymic: '', gender: '', group: '', profession: '' });
          setSelectedStudentForEdit(null);
          setShowPassword(false);
          setFormErrors({});
          setTouchedFields(new Set());
          setActiveTab('all-students');
        } else {
          if (result.errors) {
            const errors: FormErrors = {};
            if (result.errors.login) errors.login = result.errors.login[0];
            if (result.errors.surname) errors.lastName = result.errors.surname[0];
            if (result.errors.name) errors.firstName = result.errors.name[0];
            setFormErrors(errors);
          } else {
            setFormErrors({ general: result.error || 'Ошибка обновления' });
          }
        }
      } else {
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
          setFormData({ login: '', password: '', lastName: '', firstName: '', patronymic: '', gender: '', group: '', profession: '' });
          setShowPassword(false);
          setFormErrors({});
          setTouchedFields(new Set());
          setActiveTab('all-students');
        } else {
          if (result.errors) {
            const errors: FormErrors = {};
            if (result.errors.login) errors.login = result.errors.login[0];
            if (result.errors.surname) errors.lastName = result.errors.surname[0];
            if (result.errors.name) errors.firstName = result.errors.name[0];
            setFormErrors(errors);
          } else {
            setFormErrors({ general: 'Ошибка регистрации' });
          }
        }
      }
    } catch (error) {
      console.error('Ошибка:', error);
      setFormErrors({ general: 'Ошибка при сохранении' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = (type: 'groups' | 'professions' | 'topics') => {
    setCurrentManagementType(type);
    setNewItemName('');
    setManagementErrors({});
    setIsCreateModalOpen(true);
  };

  const handleCreateItem = async () => {
    if (!validateManagementForm(newItemName)) return;
    try {
      let result;
      switch (currentManagementType) {
        case 'groups': result = await createGroup(newItemName.trim()); break;
        case 'professions': result = await createProfession(newItemName.trim()); break;
        case 'topics': result = await createTopic(newItemName.trim()); break;
      }
      if (result && result.success) {
        await loadData();
        setIsCreateModalOpen(false);
        setNewItemName('');
        setManagementErrors({});
        alert('Успешно создано!');
      } else {
        if (result.errors) {
          setManagementErrors({ name: result.errors.name?.[0] || 'Ошибка создания' });
        } else {
          setManagementErrors({ general: 'Ошибка создания' });
        }
      }
    } catch (error) {
      console.error('Ошибка:', error);
      setManagementErrors({ general: 'Ошибка при создании' });
    }
  };

  const handleOpenEditModal = (item: ManagementItem) => {
    setEditingItem(item);
    setEditItemName(item.name);
    setManagementErrors({});
    setIsEditModalOpen(true);
  };

  const handleEditItem = async () => {
    if (!validateManagementForm(editItemName)) return;
    if (!editingItem) return;
    try {
      let result;
      switch (managementType) {
        case 'groups': result = await updateGroup(editingItem.id, editItemName.trim()); break;
        case 'professions': result = await updateProfession(editingItem.id, editItemName.trim()); break;
        case 'topics': result = await updateTopic(editingItem.id, editItemName.trim()); break;
      }
      if (result && result.success) {
        await loadData();
        setIsEditModalOpen(false);
        setEditingItem(null);
        setEditItemName('');
        setManagementErrors({});
        alert('Успешно обновлено!');
      } else {
        if (result.errors) {
          setManagementErrors({ name: result.errors.name?.[0] || 'Ошибка обновления' });
        } else {
          setManagementErrors({ general: 'Ошибка обновления' });
        }
      }
    } catch (error) {
      console.error('Ошибка:', error);
      setManagementErrors({ general: 'Ошибка при обновлении' });
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
        case 'groups': result = await deleteGroup(itemToDelete.id); break;
        case 'professions': result = await deleteProfession(itemToDelete.id); break;
        case 'topics': result = await deleteTopic(itemToDelete.id); break;
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

  // Вспомогательные функции для статистики
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

  const renderTeacherDefectsCell = (defects: any[]) => {
    if (!defects || defects.length === 0) {
      return <span style={{ color: '#6b7280' }}>—</span>;
    }
    const foundCount = defects.filter(d => d.status === 'found').length;
    const totalCount = defects.length;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '13px', fontWeight: '500', color: foundCount === totalCount ? '#10b981' : '#6b7280' }}>
          {foundCount}/{totalCount}
        </span>
        <div style={{ width: '40px', height: '4px', backgroundColor: '#374151', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ width: `${(foundCount / totalCount) * 100}%`, height: '100%', backgroundColor: foundCount === totalCount ? '#10b981' : '#f59e0b', borderRadius: '2px' }} />
        </div>
      </div>
    );
  };

  const renderTeacherDefectsDetailed = (defects: any[]) => {
    if (!defects || defects.length === 0) {
      return <div style={{ color: '#6b7280', padding: '12px' }}>Нет данных о неисправностях</div>;
    }
    const foundDefects = defects.filter(d => d.status === 'found');
    const notFoundDefects = defects.filter(d => d.status === 'not_found');
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {foundDefects.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '13px', fontWeight: '500', color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Обнаруженные неисправности
              </span>
              <span style={{ fontSize: '12px', color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.15)', padding: '2px 8px', borderRadius: '12px' }}>
                {foundDefects.length}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {foundDefects.map((defect, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 12px', backgroundColor: '#1e1e24', borderRadius: '6px', borderLeft: '3px solid #10b981' }}>
                  <span style={{ width: '6px', height: '6px', backgroundColor: '#10b981', borderRadius: '50%' }} />
                  <span style={{ fontSize: '13px', color: '#e5e7eb' }}>{defect.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {notFoundDefects.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '13px', fontWeight: '500', color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Пропущенные неисправности
              </span>
              <span style={{ fontSize: '12px', color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.15)', padding: '2px 8px', borderRadius: '12px' }}>
                {notFoundDefects.length}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {notFoundDefects.map((defect, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 12px', backgroundColor: '#1e1e24', borderRadius: '6px', borderLeft: '3px solid #ef4444' }}>
                  <span style={{ width: '6px', height: '6px', backgroundColor: '#ef4444', borderRadius: '50%' }} />
                  <span style={{ fontSize: '13px', color: '#e5e7eb' }}>{defect.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

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

              <div className="filters-row">
                <div className="filter-group multi-select">
                  <div className="dropdown-container">
                    <button className="dropdown-btn" onClick={() => setShowGroupDropdown(!showGroupDropdown)}>
                      {selectedGroups.includes('all') || selectedGroups.length === 0 ? 'Все группы' : `Выбрано: ${selectedGroups.length}`}
                      <span className="dropdown-arrow">▼</span>
                    </button>
                    {showGroupDropdown && (
                      <div className="dropdown-menu">
                        {availableGroups.map(group => (
                          <label key={group} className="dropdown-item">
                            <input type="checkbox" checked={selectedGroups.includes(group)} onChange={() => handleGroupToggle(group)} />
                            <span>{group === 'all' ? 'Все группы' : group}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="filter-group multi-select">
                  <div className="dropdown-container">
                    <button className="dropdown-btn" onClick={() => setShowProfessionDropdown(!showProfessionDropdown)}>
                      {selectedProfessions.includes('all') || selectedProfessions.length === 0 ? 'Все профессии' : `Выбрано: ${selectedProfessions.length}`}
                      <span className="dropdown-arrow">▼</span>
                    </button>
                    {showProfessionDropdown && (
                      <div className="dropdown-menu">
                        {availableProfessions.map(profession => (
                          <label key={profession} className="dropdown-item">
                            <input type="checkbox" checked={selectedProfessions.includes(profession)} onChange={() => handleProfessionToggle(profession)} />
                            <span>{profession === 'all' ? 'Все профессии' : profession}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <button className="clear-filters-btn" onClick={clearAllFilters}>
                  Сбросить
                </button>
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
                      <td className="student-name-cell">
                        <div style={{ fontWeight: '500', color: '#e5e7eb' }}>
                          {`${student.lastName} ${student.firstName} ${student.patronymic}`}
                        </div>
                        <div style={{ 
                          fontSize: '12px', 
                          marginTop: '4px',
                          display: 'inline-block',
                          padding: '2px 10px',
                          backgroundColor: `${getLevelColor(student.level)}20`,
                          color: getLevelColor(student.level),
                          borderRadius: '12px',
                          fontWeight: '500'
                        }}>
                          Уровень: {getLevelText(student.level)}
                        </div>
                      </td>
                      <td>{student.group}</td>
                      <td>{student.profession}</td>
                      <td className="actions-cell">
                        <button className="edit-student-btn" onClick={() => handleStudentClick(student, 'edit')}>
                          Редактировать
                        </button>
                        <button className="delete-student-btn" onClick={() => handleDeleteStudent(student)}>
                          Удалить
                        </button>
                        <button className="stats-student-btn" onClick={() => handleStudentClick(student, 'stats')}>
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
                  setFormData({ login: '', password: '', lastName: '', firstName: '', patronymic: '', gender: '', group: '', profession: '' });
                  setShowPassword(false);
                  setGeneratedPassword('');
                  setFormErrors({});
                  setTouchedFields(new Set());
                  setActiveTab('all-students');
                }}>← Назад</button>
              </div>
            )}

            {formErrors.general && (
              <div className="error-message" style={{ marginBottom: '15px', padding: '10px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', color: '#ef4444' }}>
                {formErrors.general}
              </div>
            )}

            <form className="registration-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Логин *</label>
                  <input
                    type="text"
                    name="login"
                    value={formData.login}
                    onChange={handleInputChange}
                    onBlur={() => handleFieldBlur('login')}
                    className={shouldShowError('login') && formErrors.login ? 'error-input' : ''}
                    placeholder="Введите логин"
                  />
                  {shouldShowError('login') && formErrors.login && (
                    <div className="error-message-field">{formErrors.login}</div>
                  )}
                </div>
                <div className="form-group">
                  <label>Пароль {selectedStudentForEdit && <span style={{ fontSize: '12px', color: '#888' }}>(оставьте пустым, чтобы не менять)</span>}</label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      onBlur={() => handleFieldBlur('password')}
                      className={shouldShowError('password') && formErrors.password ? 'error-input' : ''}
                      required={!selectedStudentForEdit}
                      placeholder={selectedStudentForEdit ? "Введите новый пароль" : "Введите пароль"}
                      style={{ flex: 1, minWidth: '150px' }}
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        padding: '10px 15px',
                        background: 'rgba(179, 191, 118, 0.2)',
                        border: '1px solid #b3bf76',
                        borderRadius: '10px',
                        color: '#b3bf76',
                        cursor: 'pointer',
                        fontSize: '14px',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {showPassword ? 'Скрыть' : 'Показать'}
                    </button>
                    {!selectedStudentForEdit && (
                      <button
                        type="button"
                        className="generate-password-btn"
                        onClick={handleGeneratePassword}
                      >
                        Сгенерировать
                      </button>
                    )}
                  </div>
                  {shouldShowError('password') && formErrors.password && (
                    <div className="error-message-field">{formErrors.password}</div>
                  )}
                  {selectedStudentForEdit && (
                    <small style={{ color: '#888', display: 'block', marginTop: '5px' }}>
                      Если вы не хотите менять пароль, оставьте это поле пустым.
                    </small>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Фамилия *</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    onBlur={() => handleFieldBlur('lastName')}
                    className={shouldShowError('lastName') && formErrors.lastName ? 'error-input' : ''}
                    placeholder="Введите фамилию"
                  />
                  {shouldShowError('lastName') && formErrors.lastName && (
                    <div className="error-message-field">{formErrors.lastName}</div>
                  )}
                </div>
                <div className="form-group">
                  <label>Имя *</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    onBlur={() => handleFieldBlur('firstName')}
                    className={shouldShowError('firstName') && formErrors.firstName ? 'error-input' : ''}
                    placeholder="Введите имя"
                  />
                  {shouldShowError('firstName') && formErrors.firstName && (
                    <div className="error-message-field">{formErrors.firstName}</div>
                  )}
                </div>
                <div className="form-group">
                  <label>Отчество</label>
                  <input
                    type="text"
                    name="patronymic"
                    value={formData.patronymic}
                    onChange={handleInputChange}
                    onBlur={() => handleFieldBlur('patronymic')}
                    className={shouldShowError('patronymic') && formErrors.patronymic ? 'error-input' : ''}
                    placeholder="Введите отчество"
                  />
                  {shouldShowError('patronymic') && formErrors.patronymic && (
                    <div className="error-message-field">{formErrors.patronymic}</div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Пол *</label>
                <div className="gender-group">
                  <label className="gender-option">
                    <input
                      type="radio"
                      name="gender"
                      value="male"
                      checked={formData.gender === 'male'}
                      onChange={() => handleGenderChange('male')}
                    />
                    <span>Мужской</span>
                  </label>
                  <label className="gender-option">
                    <input
                      type="radio"
                      name="gender"
                      value="female"
                      checked={formData.gender === 'female'}
                      onChange={() => handleGenderChange('female')}
                    />
                    <span>Женский</span>
                  </label>
                </div>
                {shouldShowError('gender') && formErrors.gender && (
                  <div className="error-message-field">{formErrors.gender}</div>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Группа *</label>
                  <select
                    name="group"
                    value={formData.group}
                    onChange={handleInputChange}
                    onBlur={() => handleFieldBlur('group')}
                    className={shouldShowError('group') && formErrors.group ? 'error-input' : ''}
                  >
                    <option value="">Выберите группу</option>
                    {groupOptions.map(group => (<option key={group} value={group}>{group}</option>))}
                  </select>
                  {shouldShowError('group') && formErrors.group && (
                    <div className="error-message-field">{formErrors.group}</div>
                  )}
                </div>
                <div className="form-group">
                  <label>Профессия *</label>
                  <select
                    name="profession"
                    value={formData.profession}
                    onChange={handleInputChange}
                    onBlur={() => handleFieldBlur('profession')}
                    className={shouldShowError('profession') && formErrors.profession ? 'error-input' : ''}
                  >
                    <option value="">Выберите профессию</option>
                    {professionOptions.map(profession => (<option key={profession} value={profession}>{profession}</option>))}
                  </select>
                  {shouldShowError('profession') && formErrors.profession && (
                    <div className="error-message-field">{formErrors.profession}</div>
                  )}
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? 'Загрузка...' : (selectedStudentForEdit ? 'Обновить' : 'Зарегистрировать')}
                </button>
                {selectedStudentForEdit && (
                  <button type="button" className="cancel-btn" onClick={() => {
                    setSelectedStudentForEdit(null);
                    setFormData({ login: '', password: '', lastName: '', firstName: '', patronymic: '', gender: '', group: '', profession: '' });
                    setGeneratedPassword('');
                    setFormErrors({});
                    setTouchedFields(new Set());
                    setActiveTab('all-students');
                  }}>
                    Отмена
                  </button>
                )}
                {!selectedStudentForEdit && (
                  <button type="button" className="reset-btn" onClick={() => {
                    setFormData({ login: '', password: '', lastName: '', firstName: '', patronymic: '', gender: '', group: '', profession: '' });
                    setGeneratedPassword('');
                    setFormErrors({});
                    setTouchedFields(new Set());
                  }}>Очистить</button>
                )}
              </div>
            </form>
          </>
        );

      case 'statistics':
        return (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ color: '#b3bf76', margin: 0 }}>
                {selectedStudentForStats
                  ? `Статистика: ${selectedStudentForStats.lastName} ${selectedStudentForStats.firstName}`
                  : 'Статистика прохождения заданий'
                }
              </h2>
              {selectedStudentForStats && (
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  {teacherStatisticsData.length > 0 && (
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '12px', color: '#b3bf76' }}>Всего заданий</div>
                        <div style={{ fontSize: '20px', fontWeight: '600', color: '#e5e7eb' }}>
                          {teacherStatisticsData.length}
                        </div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '12px', color: '#b3bf76' }}>Средний балл</div>
                        <div style={{
                          fontSize: '20px',
                          fontWeight: '600',
                          color: getGradeColor(
                            teacherStatisticsData.reduce((acc, s) => acc + s.grade, 0) / teacherStatisticsData.length
                          )
                        }}>
                          {(teacherStatisticsData.reduce((acc, s) => acc + s.grade, 0) / teacherStatisticsData.length).toFixed(1)}
                        </div>
                      </div>
                    </div>
                  )}
                  <button
                    className="back-btn"
                    onClick={() => {
                      setSelectedStudentForStats(null);
                      setActiveTab('all-students');
                    }}
                  >
                    ← Назад к списку
                  </button>
                </div>
              )}
            </div>

            {!selectedStudentForStats ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#b3bf76' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>📋</div>
                <p style={{ fontSize: '16px', marginBottom: '8px' }}>Выберите ученика для просмотра статистики</p>
                <p style={{ fontSize: '13px' }}>Перейдите во вкладку "Все ученики" и нажмите "Статистика"</p>
              </div>
            ) : statsLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px', color: '#b3bf76' }}>
                <div className="loading-spinner"></div>
                <p style={{ marginLeft: '15px' }}>Загрузка статистики...</p>
              </div>
            ) : teacherStatisticsData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#b3bf76' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>📋</div>
                <p style={{ fontSize: '16px', marginBottom: '8px' }}>Нет пройденных заданий</p>
                <p style={{ fontSize: '13px' }}>Ученик ещё не выполнил ни одного задания</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #374151', backgroundColor: '#1a1a20' }}>
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
                    {teacherStatisticsData.map((stat, index) => (
                      <>
                        <tr
                          key={stat.id}
                          onClick={() => setTeacherExpandedStat(teacherExpandedStat === stat.id ? null : stat.id)}
                          style={{
                            borderBottom: '1px solid #2a2a35',
                            backgroundColor: teacherExpandedStat === stat.id ? '#252530' : 'transparent',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            if (teacherExpandedStat !== stat.id) {
                              e.currentTarget.style.backgroundColor = '#1e1e28';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (teacherExpandedStat !== stat.id) {
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
                            {renderTeacherDefectsCell(stat.defects)}
                          </td>
                          <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                            <span style={{
                              display: 'inline-block',
                              color: '#6b7280',
                              transform: teacherExpandedStat === stat.id ? 'rotate(180deg)' : 'none',
                              transition: 'transform 0.2s',
                              fontSize: '12px'
                            }}>
                              ▼
                            </span>
                          </td>
                        </tr>
                        {teacherExpandedStat === stat.id && (
                          <tr>
                            <td colSpan={8} style={{ padding: '20px 24px', backgroundColor: '#1a1a22', borderBottom: '1px solid #2a2a35' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div>
                                  <div style={{ fontSize: '12px', fontWeight: '500', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
                                    Детали неисправностей
                                  </div>
                                  {renderTeacherDefectsDetailed(stat.defects)}
                                </div>
                                {stat.comment && (
                                  <div>
                                    <div style={{ fontSize: '12px', fontWeight: '500', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                                      Комментарий
                                    </div>
                                    <div style={{ padding: '12px', backgroundColor: '#1e1e24', borderRadius: '6px', color: '#d1d5db', fontSize: '13px', borderLeft: '3px solid #6b7280' }}>
                                      {stat.comment}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
        if (executingAssignment) {
          return (
            <div style={{ width: '100%', height: '100%', background: '#211f25', padding: '30px', overflow: 'auto', borderRadius: '20px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h2 style={{ color: '#b3bf76', margin: 0 }}>Выполнение задания</h2>
                <button className="back-btn" onClick={handleExitExecution} style={{ padding: '10px 20px' }}>← Назад</button>
              </div>

              <div className="assignment-details-card" style={{ flex: 1 }}>
                <div className="details-row">
                  <span className="details-label">Тема:</span>
                  <span className="details-value">{executingAssignment.topic}</span>
                </div>
                <div className="details-row">
                  <span className="details-label">Название:</span>
                  <span className="details-value">{executingAssignment.title}</span>
                </div>
                <div className="details-row">
                  <span className="details-label">Уровень сложности:</span>
                  <span className="details-value" style={{ 
                    color: getLevelColor(executingAssignment.level),
                    fontWeight: '600'
                  }}>
                    {getLevelText(executingAssignment.level)}
                  </span>
                </div>
                <div className="details-row">
                  <span className="details-label">Время суток:</span>
                  <span className="details-value">{executingAssignment.timeOfDay || 'Не выбрано'}</span>
                </div>
                <div className="details-row">
                  <span className="details-label">Погодные условия:</span>
                  <span className="details-value">{executingAssignment.weather || 'Не выбрано'}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end', marginTop: '30px' }}>
                <button className="edit-btn" onClick={() => { handleEditAssignment(executingAssignment); setExecutingAssignment(null); }}>Редактировать</button>
                <button className="create-btn" onClick={() => { handleCreateTemplate(executingAssignment); setExecutingAssignment(null); }}>Создать шаблон</button>
                <button className="delete-btn" onClick={() => { handleDeleteAssignment(); setExecutingAssignment(null); }}>Удалить</button>
              </div>
            </div>
          );
        }

        return (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2>Управление заданиями</h2>
              <button className="create-btn" onClick={handleOpenCreateForm}>+ Создать задание</button>
            </div>

            {showCreateForm && (
              <div className="create-assignment-form">
                <h3>{selectedAssignment ? 'Редактирование задания' : 'Создание нового задания'}</h3>

                {assignmentErrors.general && (
                  <div className="error-message" style={{ marginBottom: '15px', padding: '10px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', color: '#ef4444' }}>
                    {assignmentErrors.general}
                  </div>
                )}

                <div className="form-scroll">
                  <div className="form-group">
                    <label>Тема *</label>
                    <select
                      value={newAssignment.topicId}
                      onChange={(e) => {
                        const topicId = Number(e.target.value);
                        const selectedTopic = topics.find(t => t.id === topicId);
                        setNewAssignment({ ...newAssignment, topicId: topicId, topicName: selectedTopic?.name || '' });
                        setAssignmentErrors(prev => ({ ...prev, topicId: undefined }));
                      }}
                      className={assignmentErrors.topicId ? 'error-input' : ''}
                    >
                      <option value={0}>Выберите тему</option>
                      {topics.map(topic => (<option key={topic.id} value={topic.id}>{topic.name}</option>))}
                    </select>
                    {assignmentErrors.topicId && (
                      <div className="error-message-field">{assignmentErrors.topicId}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Название *</label>
                    <input
                      type="text"
                      value={newAssignment.title}
                      onChange={(e) => {
                        setNewAssignment({ ...newAssignment, title: e.target.value });
                        setAssignmentErrors(prev => ({ ...prev, title: undefined }));
                      }}
                      className={assignmentErrors.title ? 'error-input' : ''}
                      placeholder="Введите название задания"
                    />
                    {assignmentErrors.title && (
                      <div className="error-message-field">{assignmentErrors.title}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Описание *</label>
                    <textarea
                      value={newAssignment.description}
                      onChange={(e) => {
                        setNewAssignment({ ...newAssignment, description: e.target.value });
                        setAssignmentErrors(prev => ({ ...prev, description: undefined }));
                      }}
                      className={`description-textarea ${assignmentErrors.description ? 'error-input' : ''}`}
                      placeholder="Введите описание задания"
                      rows={5}
                    />
                    {assignmentErrors.description && (
                      <div className="error-message-field">{assignmentErrors.description}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Режим *</label>
                    <div className="checkbox-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={newAssignment.modes.includes('Обучение')}
                          onChange={() => {
                            handleModeChange('Обучение');
                            setAssignmentErrors(prev => ({ ...prev, modes: undefined }));
                          }}
                        />
                        <span>Обучение</span>
                      </label>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={newAssignment.modes.includes('Экзамен')}
                          onChange={() => {
                            handleModeChange('Экзамен');
                            setAssignmentErrors(prev => ({ ...prev, modes: undefined }));
                          }}
                        />
                        <span>Экзамен</span>
                      </label>
                    </div>
                    {assignmentErrors.modes && (
                      <div className="error-message-field">{assignmentErrors.modes}</div>
                    )}
                  </div>

                 

                  <div className="form-row">
                    <div className="form-group">
                      <label>Погодные условия</label>
                      <select
                        value={newAssignment.weather}
                        onChange={(e) => setNewAssignment({ ...newAssignment, weather: e.target.value })}
                      >
                        <option value="">Выберите погоду</option>
                        {weatherOptions.map(weather => (<option key={weather} value={weather}>{weather}</option>))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Время суток</label>
                      <select
                        value={newAssignment.timeOfDay}
                        onChange={(e) => setNewAssignment({ ...newAssignment, timeOfDay: e.target.value })}
                      >
                        <option value="">Выберите время</option>
                        {timeOptions.map(time => (<option key={time} value={time}>{time}</option>))}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Кому назначено *</label>
                    <div className="checkbox-group">
                      <label className="checkbox-label">
                        <input
                          type="radio"
                          name="accessType"
                          checked={selectedAssignedType === 'all'}
                          onChange={() => {
                            handleAssignedToChange('all');
                            setAssignmentErrors(prev => ({ ...prev, assignedTo: undefined, group: undefined, student: undefined }));
                          }}
                        />
                        <span>Все</span>
                      </label>
                      <label className="checkbox-label">
                        <input
                          type="radio"
                          name="accessType"
                          checked={selectedAssignedType === 'group'}
                          onChange={() => {
                            handleAssignedToChange('group');
                            setAssignmentErrors(prev => ({ ...prev, assignedTo: undefined, group: undefined, student: undefined }));
                          }}
                        />
                        <span>Группе</span>
                      </label>
                      <label className="checkbox-label">
                        <input
                          type="radio"
                          name="accessType"
                          checked={selectedAssignedType === 'student'}
                          onChange={() => {
                            handleAssignedToChange('student');
                            setAssignmentErrors(prev => ({ ...prev, assignedTo: undefined, group: undefined, student: undefined }));
                          }}
                        />
                        <span>Ученику</span>
                      </label>
                    </div>
                    {assignmentErrors.assignedTo && (
                      <div className="error-message-field">{assignmentErrors.assignedTo}</div>
                    )}
                  </div>

                  {newAssignment.assignedTo.includes('group') && (
                    <div className="form-group">
                      <label>Выберите группу *</label>
                      <select
                        value={newAssignment.groups[0] || ''}
                        onChange={(e) => {
                          setNewAssignment(prev => ({ ...prev, groups: [e.target.value] }));
                          setAssignmentErrors(prev => ({ ...prev, group: undefined }));
                        }}
                        className={assignmentErrors.group ? 'error-input' : ''}
                      >
                        <option value="">Выберите группу</option>
                        {groupOptions.map(group => (<option key={group} value={group}>{group}</option>))}
                      </select>
                      {assignmentErrors.group && (
                        <div className="error-message-field">{assignmentErrors.group}</div>
                      )}
                    </div>
                  )}

                  {selectedAssignedType === 'student' && (
                    <div className="form-group">
                      <label>Выберите ученика *</label>
                      <select
                        value={newAssignment.students[0] || ''}
                        onChange={(e) => {
                          setNewAssignment(prev => ({ ...prev, students: [Number(e.target.value)] }));
                          setAssignmentErrors(prev => ({ ...prev, student: undefined }));
                        }}
                        className={assignmentErrors.student ? 'error-input' : ''}
                      >
                        <option value="">Выберите ученика</option>
                        {students.map(student => (<option key={student.id} value={student.id}>{`${student.lastName} ${student.firstName} ${student.patronymic}`}</option>))}
                      </select>
                      {assignmentErrors.student && (
                        <div className="error-message-field">{assignmentErrors.student}</div>
                      )}
                    </div>
                  )}

                  <div className="form-group">
                    <label>Неисправности</label>
                    <div className="defects-container">
                      <div className="defects-column">
                        <h4>Доступные неисправности</h4>
                        <div className="defects-list-scroll">
                          {availableDefects.length > 0 ? (
                            availableDefects.map(defect => (
                              <div key={defect.id} className="defect-item">
                                <span className="defect-name">{defect.name}{defect.wagonTypeName && ` (${defect.wagonTypeName})`}</span>
                                <button className="add-btn" onClick={() => handleAddDefect(defect)}>+</button>
                              </div>
                            ))
                          ) : (<div className="empty-defects">Нет доступных неисправностей</div>)}
                        </div>
                      </div>
                      <div className="defects-column">
                        <h4>Выбранные неисправности</h4>
                        <div className="defects-list-scroll">
                          {selectedDefects.length > 0 ? (
                            selectedDefects.map(defect => (
                              <div key={defect.id} className="defect-item selected">
                                <span className="defect-name">{defect.name}{defect.wagonTypeName && ` (${defect.wagonTypeName})`}</span>
                                <button className="remove-btn" onClick={() => handleRemoveDefect(defect)}>-</button>
                              </div>
                            ))
                          ) : (<div className="empty-defects">Нет выбранных неисправностей</div>)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="form-actions">
                  <button className="submit-btn" onClick={selectedAssignment ? handleUpdateAssignment : handleCreateAssignment}>
                    {selectedAssignment ? 'Обновить' : 'Создать'}
                  </button>
                  <button className="reset-btn" onClick={() => {
                    setShowCreateForm(false);
                    setSelectedAssignment(null);
                    resetAssignmentForm();
                  }}>Отмена</button>
                </div>
              </div>
            )}

            {showTemplateForm && (
              <div className="create-assignment-form">
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                  <button className="back-btn" onClick={() => { setShowTemplateForm(false); resetAssignmentForm(); }}>← Назад</button>
                  <h3 style={{ margin: 0 }}>Создание задания из шаблона</h3>
                </div>

                {assignmentErrors.general && (
                  <div className="error-message" style={{ marginBottom: '15px', padding: '10px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', color: '#ef4444' }}>
                    {assignmentErrors.general}
                  </div>
                )}

                <div className="form-scroll">
                  <div className="form-group">
                    <label>Тема *</label>
                    <select
                      value={newAssignment.topicId}
                      onChange={(e) => {
                        const topicId = Number(e.target.value);
                        const selectedTopic = topics.find(t => t.id === topicId);
                        setNewAssignment({ ...newAssignment, topicId: topicId, topicName: selectedTopic?.name || '' });
                        setAssignmentErrors(prev => ({ ...prev, topicId: undefined }));
                      }}
                      className={assignmentErrors.topicId ? 'error-input' : ''}
                    >
                      <option value={0}>Выберите тему</option>
                      {topics.map(topic => (<option key={topic.id} value={topic.id}>{topic.name}</option>))}
                    </select>
                    {assignmentErrors.topicId && (
                      <div className="error-message-field">{assignmentErrors.topicId}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Название *</label>
                    <input
                      type="text"
                      value={newAssignment.title}
                      onChange={(e) => {
                        setNewAssignment({ ...newAssignment, title: e.target.value });
                        setAssignmentErrors(prev => ({ ...prev, title: undefined }));
                      }}
                      className={assignmentErrors.title ? 'error-input' : ''}
                      placeholder="Введите название задания"
                    />
                    {assignmentErrors.title && (
                      <div className="error-message-field">{assignmentErrors.title}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Описание *</label>
                    <textarea
                      value={newAssignment.description}
                      onChange={(e) => {
                        setNewAssignment({ ...newAssignment, description: e.target.value });
                        setAssignmentErrors(prev => ({ ...prev, description: undefined }));
                      }}
                      className={`description-textarea ${assignmentErrors.description ? 'error-input' : ''}`}
                      placeholder="Введите описание задания"
                      rows={5}
                    />
                    {assignmentErrors.description && (
                      <div className="error-message-field">{assignmentErrors.description}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Режим *</label>
                    <div className="checkbox-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={newAssignment.modes.includes('Обучение')}
                          onChange={() => {
                            handleModeChange('Обучение');
                            setAssignmentErrors(prev => ({ ...prev, modes: undefined }));
                          }}
                        />
                        <span>Обучение</span>
                      </label>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={newAssignment.modes.includes('Экзамен')}
                          onChange={() => {
                            handleModeChange('Экзамен');
                            setAssignmentErrors(prev => ({ ...prev, modes: undefined }));
                          }}
                        />
                        <span>Экзамен</span>
                      </label>
                    </div>
                    {assignmentErrors.modes && (
                      <div className="error-message-field">{assignmentErrors.modes}</div>
                    )}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Погодные условия</label>
                      <select value={newAssignment.weather} onChange={(e) => setNewAssignment({ ...newAssignment, weather: e.target.value })}>
                        <option value="">Выберите погоду</option>
                        {weatherOptions.map(weather => (<option key={weather} value={weather}>{weather}</option>))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Время суток</label>
                      <select value={newAssignment.timeOfDay} onChange={(e) => setNewAssignment({ ...newAssignment, timeOfDay: e.target.value })}>
                        <option value="">Выберите время</option>
                        {timeOptions.map(time => (<option key={time} value={time}>{time}</option>))}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Кому назначено *</label>
                    <div className="checkbox-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={newAssignment.assignedTo.includes('all')}
                          onChange={() => {
                            handleAssignedToChange('all');
                            setAssignmentErrors(prev => ({ ...prev, assignedTo: undefined, group: undefined, student: undefined }));
                          }}
                        />
                        <span>Все</span>
                      </label>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={newAssignment.assignedTo.includes('group')}
                          onChange={() => {
                            handleAssignedToChange('group');
                            setAssignmentErrors(prev => ({ ...prev, assignedTo: undefined, group: undefined, student: undefined }));
                          }}
                        />
                        <span>Группе</span>
                      </label>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={newAssignment.assignedTo.includes('student')}
                          onChange={() => {
                            handleAssignedToChange('student');
                            setAssignmentErrors(prev => ({ ...prev, assignedTo: undefined, group: undefined, student: undefined }));
                          }}
                        />
                        <span>Ученику</span>
                      </label>
                    </div>
                    {assignmentErrors.assignedTo && (
                      <div className="error-message-field">{assignmentErrors.assignedTo}</div>
                    )}
                  </div>

                  {newAssignment.assignedTo.includes('group') && (
                    <div className="form-group">
                      <label>Выберите группу *</label>
                      <select
                        value={newAssignment.groups[0] || ''}
                        onChange={(e) => {
                          setNewAssignment(prev => ({ ...prev, groups: [e.target.value] }));
                          setAssignmentErrors(prev => ({ ...prev, group: undefined }));
                        }}
                        className={assignmentErrors.group ? 'error-input' : ''}
                      >
                        <option value="">Выберите группу</option>
                        {groupOptions.map(group => (<option key={group} value={group}>{group}</option>))}
                      </select>
                      {assignmentErrors.group && (
                        <div className="error-message-field">{assignmentErrors.group}</div>
                      )}
                    </div>
                  )}

                  {newAssignment.assignedTo.includes('student') && (
                    <div className="form-group">
                      <label>Выберите ученика *</label>
                      <select
                        value={newAssignment.students[0] || ''}
                        onChange={(e) => {
                          setNewAssignment(prev => ({ ...prev, students: [Number(e.target.value)] }));
                          setAssignmentErrors(prev => ({ ...prev, student: undefined }));
                        }}
                        className={assignmentErrors.student ? 'error-input' : ''}
                      >
                        <option value="">Выберите ученика</option>
                        {students.map(student => (<option key={student.id} value={student.id}>{`${student.lastName} ${student.firstName} ${student.patronymic}`}</option>))}
                      </select>
                      {assignmentErrors.student && (
                        <div className="error-message-field">{assignmentErrors.student}</div>
                      )}
                    </div>
                  )}

                  <div className="form-group">
                    <label>Неисправности</label>
                    <div className="defects-container">
                      <div className="defects-column">
                        <h4>Доступные неисправности</h4>
                        <div className="defects-list-scroll">
                          {availableDefects.length > 0 ? (
                            availableDefects.map(defect => (
                              <div key={defect.id} className="defect-item">
                                <span className="defect-name">{defect.name}{defect.wagonTypeName && ` (${defect.wagonTypeName})`}</span>
                                <button className="add-btn" onClick={() => handleAddDefect(defect)}>+</button>
                              </div>
                            ))
                          ) : (<div className="empty-defects">Нет доступных неисправностей</div>)}
                        </div>
                      </div>
                      <div className="defects-column">
                        <h4>Выбранные неисправности</h4>
                        <div className="defects-list-scroll">
                          {selectedDefects.length > 0 ? (
                            selectedDefects.map(defect => (
                              <div key={defect.id} className="defect-item selected">
                                <span className="defect-name">{defect.name}{defect.wagonTypeName && ` (${defect.wagonTypeName})`}</span>
                                <button className="remove-btn" onClick={() => handleRemoveDefect(defect)}>-</button>
                              </div>
                            ))
                          ) : (<div className="empty-defects">Нет выбранных неисправностей</div>)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="form-actions">
                  <button className="submit-btn" onClick={handleCreateFromTemplate}>Создать</button>
                  <button className="reset-btn" onClick={() => { setShowTemplateForm(false); resetAssignmentForm(); }}>Отмена</button>
                </div>
              </div>
            )}

            {!showCreateForm && !showTemplateForm && (
              <>
                {getUniqueTopicsWithAssignments().length > 0 ? (
                  <div className="topics-list">
                    {getUniqueTopicsWithAssignments().map(topic => (
                      <div key={topic.id} className={`topic-item ${selectedTopic === topic.name ? 'active' : ''}`} onClick={() => setSelectedTopic(selectedTopic === topic.name ? null : topic.name)}>
                        <span className="topic-name">{topic.name}</span>
                        <span className="topic-count">{getAssignmentsByTopic(topic.name).length} заданий</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-assignments">
                    <p>Нет созданных заданий. Нажмите кнопку "Создать задание" чтобы добавить первое задание.</p>
                  </div>
                )}

                {selectedTopic && (
                  <div className="assignments-by-topic">
                    <h3>Задания по теме: {selectedTopic}</h3>
                    <div className="assignments-list">
                      {getAssignmentsByTopic(selectedTopic).map(assignment => (
                        <div key={assignment.id} className="assignment-card">
                          <div className="assignment-header">
                            <h4>{assignment.title}</h4>
                            <span className="assignment-date">{assignment.createdAt}</span>
                          </div>
                          <div style={{ display: 'flex', gap: '10px', marginTop: '8px', marginBottom: '8px' }}>
                            <span className="difficulty-badge" style={{ 
                              backgroundColor: `${getLevelColor(assignment.level)}20`,
                              color: getLevelColor(assignment.level),
                              border: `1px solid ${getLevelColor(assignment.level)}40`
                            }}>
                              Уровень: {getLevelText(assignment.level)}
                            </span>
                          </div>
                          <div className="assignment-actions-card" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button className="execute-btn" onClick={() => handleViewAssignment(assignment)}>Выполнить</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
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
        <div className="menu-buttons-wrapper">
          <div className="menu-buttons">
            <button className={`menu-btn all-students-btn ${activeTab === 'all-students' ? 'active' : ''}`} onClick={() => setActiveTab('all-students')}>
              <span className="btn-title">Все ученики</span>
              <span className="btn-subtitle">список всех учеников</span>
            </button>
            <button className={`menu-btn registration-btn ${activeTab === 'registration' ? 'active' : ''}`} onClick={() => setActiveTab('registration')}>
              <span className="btn-title">Регистрация</span>
              <span className="btn-subtitle">создание записей пользователей</span>
            </button>
            <button className={`menu-btn management-btn ${activeTab === 'management' ? 'active' : ''}`} onClick={() => setActiveTab('management')}>
              <span className="btn-title">Управление</span>
              <span className="btn-subtitle">управление группами, профессиями и т.д.</span>
            </button>
            <button className={`menu-btn assignments-btn ${activeTab === 'assignments' ? 'active' : ''}`} onClick={() => setActiveTab('assignments')}>
              <span className="btn-title">Задания</span>
              <span className="btn-subtitle">создание и редактирование уроков</span>
            </button>
            <button className="modal-btn cancel-btn" onClick={onBack}>Выход</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherProfile;