// nodemon app.js하고 실행해서
// xampp mysql실행-> sqlorg-> postman(데이터베이스앱)
// 나는 codepen.io로 실행했었으나 
// 보통은http://localhost:3000/${userCode}/todos 쳐서 웹서버 들어가기
console.clear();

// # 임포트 시작
const { useState, useRef, useEffect, useMemo } = React;

import classNames from "https://cdn.skypack.dev/classnames";

import { produce } from "https://cdn.skypack.dev/immer";

const {
  RecoilRoot,
  atom,
  atomFamily,
  useRecoilState,
  useSetRecoilState,
  useRecoilValue
} = Recoil;

import { recoilPersist } from "https://cdn.skypack.dev/recoil-persist";

const {
  HashRouter: Router,
  Routes,
  Route,
  NavLink,
  Navigate,
  useParams,
  useNavigate,
  useLocation
} = ReactRouterDOM;

const {
  colors,
  CssBaseline,
  ThemeProvider,
  createTheme,
  Link,
  Button,
  AppBar,
  Toolbar,
  TextField,
  Chip,
  Box,
  SwipeableDrawer,
  List,
  ListItem,
  Divider,
  Modal,
  Snackbar,
  Alert: MuiAlert,
  Tabs,
  Tab
} = MaterialUI;
// # 임포트 끝

// # 유틸리티 시작

// 날짜 객체 입력받아서 문장(yyyy-mm-dd hh:mm:ss)으로 반환한다.
function dateToStr(d) {
  const pad = (n) => {
    return n < 10 ? "0" + n : n;
  };

  return (
    d.getFullYear() +
    "-" +
    pad(d.getMonth() + 1) +
    "-" +
    pad(d.getDate()) +
    " " +
    pad(d.getHours()) +
    ":" +
    pad(d.getMinutes()) +
    ":" +
    pad(d.getSeconds())
  );
}

// # 유틸리티 끝

// # 비지니스 로직 변수 세팅 시작
const userCode = window.location.hostname;
const API_TODOS_URL = `http://localhost:3000/${userCode}/todos`;
// # 비지니스 로직 변수 세팅 끝

// # 리코일 퍼시스트 저장소 시작
const { persistAtom: persistAtomCommon } = recoilPersist({
  key: "persistAtomCommon"
});

// # 리코일 퍼시스트 저장소 끝

// # 유틸리티 컴포넌트 시작
// ## 커스텀 스낵바 시작
const noticeSnackbarInfoAtom = atom({
  key: "app/noticeSnackbarInfoAtom",
  default: {
    opened: false,
    autoHideDuration: 0,
    severity: "",
    msg: ""
  }
});

function useNoticeSnackbarStatus() {
  const [noticeSnackbarInfo, setNoticeSnackbarInfo] = useRecoilState(
    noticeSnackbarInfoAtom
  );

  const opened = noticeSnackbarInfo.opened;
  const autoHideDuration = noticeSnackbarInfo.autoHideDuration;
  const severity = noticeSnackbarInfo.severity;
  const msg = noticeSnackbarInfo.msg;

  const open = (msg, severity = "success", autoHideDuration = 6000) => {
    setNoticeSnackbarInfo({
      opened: true,
      msg,
      severity,
      autoHideDuration
    });
  };

  const close = () => {
    setNoticeSnackbarInfo({
      ...noticeSnackbarInfo,
      opened: false
    });
  };

  return {
    opened,
    open,
    close,
    autoHideDuration,
    severity,
    msg
  };
}

const Alert = React.forwardRef((props, ref) => {
  return <MuiAlert {...props} ref={ref} variant="filled" />;
});

function NoticeSnackbar() {
  const status = useNoticeSnackbarStatus();

  return (
    <>
      <Snackbar
        open={status.opened}
        autoHideDuration={status.autoHideDuration}
        onClose={status.close}
      >
        <Alert severity={status.severity}>{status.msg}</Alert>
      </Snackbar>
    </>
  );
}
// ## 커스텀 스낵바 끝

// # 유틸리티 컴포넌트 끝

// # 비지니스 로직 시작

// ## todosStatus 시작
const todosIsLoadingAtom = atom({
  key: "app/todosIsLoadingAtom",
  default: true
});

const todosAtom = atom({
  key: "app/todosAtom",
  default: []
});

function useTodosStatus() {
  const [todosIsLoading, setTodosIsLoading] = useRecoilState(
    todosIsLoadingAtom
  );
  const [todos, setTodos] = useRecoilState(todosAtom);

  const reloadTodos = async () => {
    try {
      const data = await fetch(`${API_TODOS_URL}`);

      if (data.status >= 400 && data.status < 600) {
        throw new Error(data.msg);
      }

      const dataJson = await data.json();
      const newTodos = dataJson.data.map((todo) => ({
        no: todo.no,
        regDate: todo.reg_date,
        updateDate: todo.update_date,
        performDate: todo.perform_date,
        content: todo.content,
        completed: todo.is_completed === 1
      }));
      setTodos(newTodos);
      setTodosIsLoading(false);
    } catch (err) {
      alert(err.message);
      window.location.reload();
    }
  };

  const addTodo = async (performDate, newContent) => {
    try {
      const fetchRs = await fetch(`${API_TODOS_URL}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          perform_date: dateToStr(new Date(performDate)),
          content: newContent,
          is_completed: 0
        })
      });

      const fetchRsJson = await fetchRs.json();

      const no = fetchRsJson.data.no;

      const newTodo = {
        no,
        regDate: fetchRsJson.data.reg_date,
        performDate: fetchRsJson.data.perform_date,
        content: fetchRsJson.data.content,
        completed: fetchRsJson.data.is_completed === 1
      };

      setTodos((todos) => [newTodo, ...todos]);

      return no;
    } catch (err) {
      alert(err.message);
      window.location.reload();
    }
  };

  const modifyTodoByNo = async (no, performDate, newContent) => {
    const index = findTodoIndexByNo(no);

    if (index == -1) {
      return;
    }

    try {
      const fetchRs = await fetch(`${API_TODOS_URL}/${no}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          perform_date: performDate,
          content: newContent
        })
      });

      if (fetchRs.status >= 400 && fetchRs.status < 600) {
        throw new Error(data.msg);
      }

      const newTodos = produce(todos, (draft) => {
        draft[index].performDate = dateToStr(new Date(performDate));
        draft[index].content = newContent;
      });

      setTodos(newTodos);
    } catch (err) {
      alert(err.message);
      window.location.reload();
    }
  };

  const toggleTodoCompletedByNo = async (no) => {
    const index = findTodoIndexByNo(no);

    if (index == -1) {
      return;
    }

    try {
      const fetchRs = await fetch(`${API_TODOS_URL}/${no}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          is_completed: todos[index].completed ? 0 : 1
        })
      });

      if (fetchRs.status >= 400 && fetchRs.status < 600) {
        throw new Error(data.msg);
      }

      setTodos(
        produce(todos, (draft) => {
          draft[index].completed = !draft[index].completed;
        })
      );
    } catch (err) {
      alert(err.message);
      window.location.reload();
    }
  };

  const removeTodoByNo = async (no) => {
    const index = findTodoIndexByNo(no);

    if (index == -1) {
      return;
    }

    try {
      const fetchRs = await fetch(`${API_TODOS_URL}/${no}`, {
        method: "DELETE"
      });

      if (fetchRs.status >= 400 && fetchRs.status < 600) {
        throw new Error(fetchRs.msg);
      }

      const newTodos = todos.filter((_, _index) => _index != index);
      setTodos(newTodos);
    } catch (err) {
      alert(err.message);
      window.location.reload();
    }
  };

  const findTodoIndexByNo = (no) => {
    return todos.findIndex((todo) => todo.no == no);
  };

  const findTodoByNo = (no) => {
    const index = findTodoIndexByNo(no);

    if (index == -1) {
      return null;
    }

    return todos[index];
  };

  return {
    todos,
    addTodo,
    modifyTodoByNo,
    toggleTodoCompletedByNo,
    removeTodoByNo,
    findTodoByNo,
    todosIsLoading,
    reloadTodos
  };
}
// ## todosStatus 끝

// # 비지니스 로직 끝

// # 공통 컴포넌트 시작

// # 공통 컴포넌트 끝

// # 페이지들 시작

// ## 메인 페이지관련 컴포넌트 시작
function TodosLoading() {
  return (
    <>
      <div className="flex-1 flex justify-center items-center">
        <div>로딩중..</div>
      </div>
    </>
  );
}

function TodosEmpty() {
  return (
    <>
      <div className="flex-1 flex justify-center items-center">
        <div className="grid gap-2">
          <span>
            <span className="text-[color:var(--mui-color-primary-main)]">
              할일
            </span>
            을 입력해주세요.
          </span>
          <Button
            size="large"
            variant="contained"
            component={NavLink}
            to="/write"
          >
            할일 추가하기
          </Button>
        </div>
      </div>
    </>
  );
}

const TodoList__filterCompletedIndexAtom = atom({
  key: "app/TodoList__filterCompletedIndexAtom",
  default: 0,
  effects_UNSTABLE: [persistAtomCommon]
});

const TodoList__sortIndexAtom = atom({
  key: "app/TodoList__sortIndexAtom",
  default: 0,
  effects_UNSTABLE: [persistAtomCommon]
});

function TodoList() {
  const todosStatus = useTodosStatus();
  const todoOptionDrawerStatus = useTodoOptionDrawerStatus();
  const onCompletedBtnClicked = (no) => todosStatus.toggleTodoCompletedByNo(no);

  const [filterCompletedIndex, setFilterCompletedIndex] = useRecoilState(
    TodoList__filterCompletedIndexAtom
  );

  const [sortIndex, setSortIndex] = useRecoilState(TodoList__sortIndexAtom);

  const getFilteredTodos = () => {
    if (filterCompletedIndex == 1)
      return todosStatus.todos.filter((todo) => !todo.completed);

    if (filterCompletedIndex == 2)
      return todosStatus.todos.filter((todo) => todo.completed);

    return todosStatus.todos;
  };

  const filteredTodos = getFilteredTodos();

  const getSortedTodos = () => {
    if (sortIndex == 0) {
      return [...filteredTodos].sort((a, b) => {
        if (a.performDate == b.performDate) return 0;

        return a.performDate > b.performDate ? 1 : -1;
      });
    } else if (sortIndex == 1) {
      return [...filteredTodos].sort((a, b) => {
        if (a.performDate == b.performDate) return 0;

        return a.performDate < b.performDate ? 1 : -1;
      });
    } else if (sortIndex == 2) {
      return [...filteredTodos].sort((a, b) => {
        return a.no > b.no ? 1 : -1;
      });
    }

    return filteredTodos;
  };

  const sortedTodos = getSortedTodos();

  return (
    <>
      <TodoOptionDrawer status={todoOptionDrawerStatus} />

      <Tabs
        variant="fullWidth"
        value={filterCompletedIndex}
        onChange={(event, newValue) => setFilterCompletedIndex(newValue)}
      >
        <Tab
          label={
            <span className="flex">
              <i className="fa-solid fa-list-ul"></i>
              <span className="ml-2">전체</span>
            </span>
          }
          value={0}
        />
        <Tab
          label={
            <span className="flex">
              <i className="fa-regular fa-square"></i>
              <span className="ml-2">미완료</span>
            </span>
          }
          value={1}
        />
        <Tab
          label={
            <span className="flex">
              <i className="fa-regular fa-square-check"></i>
              <span className="ml-2">완료</span>
            </span>
          }
          value={2}
        />
      </Tabs>

      <Tabs
        variant="scrollable"
        value={sortIndex}
        onChange={(event, newValue) => {
          setSortIndex(newValue);
        }}
      >
        <Tab
          className="flex-grow !max-w-[none] px-4"
          label={
            <span className="flex items-baseline">
              <i className="fa-regular fa-clock mr-2"></i>
              <span className="mr-2 whitespace-nowrap">급해요</span>
              <i className="fa-solid fa-sort-up relative top-[3px]"></i>
            </span>
          }
          value={0}
        />
        <Tab
          className="flex-grow !max-w-[none] px-4"
          label={
            <span className="flex items-baseline">
              <i className="fa-regular fa-clock mr-2"></i>
              <span className="mr-2 whitespace-nowrap">널럴해요</span>
              <i className="fa-solid fa-sort-down relative top-[-3px]"></i>
            </span>
          }
          value={1}
        />
        <Tab
          className="flex-grow !max-w-[none] px-4"
          label={
            <span className="flex items-baseline">
              <i className="fa-solid fa-pen mr-2"></i>
              <span className="mr-2 whitespace-nowrap">작성순</span>
              <i className="fa-solid fa-sort-up relative top-[3px]"></i>
            </span>
          }
          value={2}
        />
        <Tab
          className="flex-grow !max-w-[none] px-4"
          label={
            <span className="flex items-baseline">
              <i className="fa-solid fa-pen mr-2"></i>
              <span className="mr-2 whitespace-nowrap">작성순</span>
              <i className="fa-solid fa-sort-down relative top-[-3px]"></i>
            </span>
          }
          value={3}
        />
      </Tabs>

      <div className="px-6 sm:px-8 pb-6 sm:pb-8">
        <ul>
          {sortedTodos.map((todo, index) => (
            <TodoListItem
              key={todo.no}
              todo={todo}
              index={index}
              onCompletedBtnClicked={onCompletedBtnClicked}
              openDrawer={todoOptionDrawerStatus.open}
            />
          ))}
        </ul>
      </div>
    </>
  );
}

function TodoListItem({ onCompletedBtnClicked, todo, index, openDrawer }) {
  return (
    <>
      <li key={todo.no} className="mt-6 sm:mt-8">
        <div className="flex gap-2">
          <Chip
            label={`번호 : ${todo.no}`}
            variant="outlined"
            className="!pt-1"
          />
          <Chip
            label={todo.performDate.substr(2, 14)}
            color="primary"
            variant="outlined"
            className="!pt-1"
          />
        </div>
        <div className="mt-2 sm:mt-4 shadow rounded-[20px] flex">
          <Button
            className="flex-shrink-0 !items-start !rounded-[20px_0_0_20px]"
            color="inherit"
            onClick={() => onCompletedBtnClicked(todo.no)}
          >
            <span
              className={classNames(
                "text-4xl",
                "h-[80px]",
                "flex items-center",
                {
                  "text-[color:var(--mui-color-primary-main)]": todo.completed
                },
                { "text-[#dcdcdc]": !todo.completed }
              )}
            >
              <i className="fa-solid fa-check"></i>
            </span>
          </Button>
          <div className="flex-shrink-0 my-5 w-[2px] bg-[#dcdcdc] mr-4"></div>
          <div className="whitespace-pre-wrap leading-relaxed hover:text-[color:var(--mui-color-primary-main)] flex-grow flex items-center my-5">
            {todo.content}
          </div>
          <Button
            onClick={() => openDrawer(todo.no)}
            className="flex-shrink-0 !items-start !rounded-[0_20px_20px_0]"
            color="inherit"
          >
            <span className="text-[#dcdcdc] text-2xl h-[80px] flex items-center">
              <i className="fa-solid fa-ellipsis-vertical"></i>
            </span>
          </Button>
        </div>
      </li>
    </>
  );
}

function useTodoOptionDrawerStatus() {
  const [todoNo, setTodoNo] = useState(null);
  const opened = useMemo(() => todoNo !== null, [todoNo]);
  const close = () => setTodoNo(null);
  const open = (no) => setTodoNo(no);

  return {
    todoNo,
    opened,
    close,
    open
  };
}

function TodoOptionDrawer({ status }) {
  const noticeSnackbarStatus = useNoticeSnackbarStatus();
  const todosStatus = useTodosStatus();

  const removeTodo = async () => {
    if (confirm(`${status.todoNo}번 할일을 삭제하시겠습니까?`) == false) {
      status.close();
      return;
    }

    await todosStatus.removeTodoByNo(status.todoNo);

    status.close();
    noticeSnackbarStatus.open(
      `${status.todoNo}번 할일이 삭제되었습니다.`,
      "info"
    );
  };

  const todo = todosStatus.findTodoByNo(status.todoNo);

  return (
    <>
      <SwipeableDrawer
        anchor={"bottom"}
        onOpen={() => {}}
        open={status.opened}
        onClose={status.close}
      >
        <List className="!py-0">
          <ListItem className="!pt-6 !p-5">
            <span className="text-[color:var(--mui-color-primary-main)]">
              {todo?.no}번
            </span>
            <span>&nbsp;</span>
            <span>할일에 대해서</span>
          </ListItem>
          <Divider />
          <ListItem
            className="!pt-6 !p-5 !items-baseline"
            button
            onClick={removeTodo}
          >
            <i className="fa-solid fa-trash-can"></i>
            &nbsp;
            <span>삭제</span>
          </ListItem>
          <ListItem
            className="!pt-6 !p-5 !items-baseline"
            button
            component={NavLink}
            to={`/edit/${todo?.no}`}
          >
            <i className="fa-solid fa-pen-to-square"></i>
            &nbsp;
            <span>수정</span>
          </ListItem>
        </List>
      </SwipeableDrawer>
    </>
  );
}
// ## 메인 페이지관련 컴포넌트 끝

// ## 메인 페이지 시작
function MainPage() {
  const todosStatus = useTodosStatus();

  if (todosStatus.todosIsLoading) {
    return <TodosLoading />;
  }

  const todosEmpty = todosStatus.todos.length == 0;

  if (todosEmpty) {
    return <TodosEmpty />;
  }

  return (
    <>
      <TodoList />
    </>
  );
}
// ## 메인 페이지 끝

// ## 글쓰기 페이지관련 컴포넌트 시작

// ## 글쓰기 페이지관련 컴포넌트 끝

// ## 글쓰기 페이지 시작
function WritePage() {
  const noticeSnackbarStatus = useNoticeSnackbarStatus();
  const todosStatus = useTodosStatus();

  const onSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;

    if (form.performDate.value.length == 0) {
      alert("언제 해야하는지 알려주세요.");
      form.performDate.focus();

      return;
    }

    if (form.content.value.length == 0) {
      alert("무엇을 해야하는지 알려주세요.");
      form.content.focus();

      return;
    }

    const newTodoNo = await todosStatus.addTodo(
      form.performDate.value,
      form.content.value
    );

    noticeSnackbarStatus.open(`${newTodoNo}번 할일이 등록되었습니다.`);

    form.content.value = "";
    form.content.focus();
  };

  return (
    <>
      <form
        className="flex-1 flex flex-col gap-6 p-6 sm:p-8"
        onSubmit={onSubmit}
      >
        <TextField
          name="performDate"
          label="언제 해야 되나요?"
          focused
          type="datetime-local"
        />
        <TextField
          name="content"
          className="flex-1 flex"
          InputProps={{ className: "flex-1 flex-col" }}
          inputProps={{ className: "flex-1" }}
          label="무엇을 해야 하나요?"
          multiline
        />
        <Button type="submit" variant="contained">
          <i className="fa-solid fa-marker"></i>
          <span>&nbsp;</span>
          <span>할일추가</span>
        </Button>
      </form>
    </>
  );
}
// ## 글쓰기 페이지 끝

// ## 글수정 페이지관련 컴포넌트 시작

// ## 글수정 페이지관련 컴포넌트 끝

// ## 글수정 페이지 시작
function EditPage() {
  const navigate = useNavigate();
  const { no } = useParams();

  const noticeSnackbarStatus = useNoticeSnackbarStatus();
  const todosStatus = useTodosStatus();

  const todo = todosStatus.findTodoByNo(no);

  const onSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;

    if (form.performDate.value.length == 0) {
      alert("언제 해야하는지 알려주세요.");
      form.performDate.focus();

      return;
    }

    if (form.content.value.length == 0) {
      alert("무엇을 해야하는지 알려주세요.");
      form.content.focus();

      return;
    }

    await todosStatus.modifyTodoByNo(
      todo.no,
      form.performDate.value,
      form.content.value
    );

    noticeSnackbarStatus.open(`${todo.no}번 할일이 수정되었습니다.`, "info");

    navigate(-1);
  };

  const performDateForInput = todo.performDate.substr(0, 16).replace(" ", "T");

  return (
    <>
      <form
        className="flex-1 flex flex-col gap-6 p-6 sm:p-8"
        onSubmit={onSubmit}
      >
        <TextField
          name="performDate"
          label="언제 해야 되나요?"
          focused
          type="datetime-local"
          defaultValue={performDateForInput}
        />
        <TextField
          name="content"
          className="flex-1 flex"
          InputProps={{ className: "flex-1 flex-col" }}
          inputProps={{ className: "flex-1" }}
          label="무엇을 해야 하나요?"
          multiline
          defaultValue={todo.content}
        />
        <Button type="submit" variant="contained">
          <i className="fa-solid fa-marker"></i>
          <span>&nbsp;</span>
          <span>{todo.no}번 할일수정</span>
        </Button>
      </form>
    </>
  );
}
// ## 글수정 페이지 끝

// # 페이지들 끝

// # 앱 세팅 시작
function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const todosStatus = useTodosStatus();

  useEffect(() => {
    todosStatus.reloadTodos();
  }, []);

  return (
    <>
      <AppBar position="fixed">
        <Toolbar>
          <NavLink
            to="/main"
            className="font-bold select-none self-stretch flex items-center mr-auto"
          >
            Todos
          </NavLink>

          {location.pathname == "/main" && (
            <NavLink
              className="select-none self-stretch flex items-center"
              to="/write"
            >
              할일추가
            </NavLink>
          )}
          {location.pathname != "/main" && (
            <span
              className="select-none cursor-pointer self-stretch flex items-center"
              onClick={() => navigate(-1)}
            >
              뒤로가기
            </span>
          )}
        </Toolbar>
      </AppBar>
      <Toolbar />
      <NoticeSnackbar />
      <Routes>
        <Route path="/main" element={<MainPage />} />
        <Route path="/write" element={<WritePage />} />
        <Route path="/edit/:no" element={<EditPage />} />
        <Route path="*" element={<Navigate to="/main" />} />
      </Routes>
    </>
  );
}

const muiThemePaletteKeys = [
  "background",
  "common",
  "error",
  "grey",
  "info",
  "primary",
  "secondary",
  "success",
  "text",
  "warning"
];

function Root() {
  // Create a theme instance.
  const theme = createTheme({
    typography: {
      fontFamily: ["GmarketSansMedium"]
    },
    // 앱 테마
    palette: {
      primary: {
        main: "#525e5e",
        contrastText: "#d7d7cb"
      }
    }
  });

  useEffect(() => {
    const r = document.querySelector(":root");

    muiThemePaletteKeys.forEach((paletteKey) => {
      const themeColorObj = theme.palette[paletteKey];

      for (const key in themeColorObj) {
        if (Object.hasOwnProperty.call(themeColorObj, key)) {
          const colorVal = themeColorObj[key];
          r.style.setProperty(`--mui-color-${paletteKey}-${key}`, colorVal);
        }
      }
    });
  }, []);

  return (
    <RecoilRoot>
      <Router>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <App />
        </ThemeProvider>
      </Router>
    </RecoilRoot>
  );
}

// Sample todo data
const todos = [
  {
    id: 1,
    content: 'Buy groceries',
    performDate: '2023-05-20 10:00:00',
    completed: true,
    completedDate: '2023-05-20 11:00:00'
  },
  {
    id: 2,
    content: 'Write report',
    performDate: '2023-05-21 12:00:00',
    completed: false,
    completedDate: null
  },
  {
    id: 3,
    content: 'Exercise',
    performDate: '2023-05-22 07:00:00',
    completed: true,
    completedDate: '2023-05-22 08:00:00'
  },
  // Add more todos as needed
];

// Function to calculate statistics
function calculateTodoStatistics(todos) {
  const totalTodos = todos.length;
  const completedTodos = todos.filter(todo => todo.completed).length;
  const pendingTodos = totalTodos - completedTodos;

  const completedTodosByDate = todos.reduce((acc, todo) => {
    if (todo.completedDate) {
      const date = todo.completedDate.split(' ')[0]; // Extract date part
      if (!acc[date]) {
        acc[date] = 0;
      }
      acc[date]++;
    }
    return acc;
  }, {});

  return {
    totalTodos,
    completedTodos,
    pendingTodos,
    completedTodosByDate
  };
}

// Function to display statistics
function displayTodoStatistics(statistics) {
  console.log('Todo Statistics');
  console.log('----------------');
  console.log(`Total Todos: ${statistics.totalTodos}`);
  console.log(`Completed Todos: ${statistics.completedTodos}`);
  console.log(`Pending Todos: ${statistics.pendingTodos}`);
  console.log('Completed Todos by Date:');
  for (const [date, count] of Object.entries(statistics.completedTodosByDate)) {
    console.log(`${date}: ${count} completed`);
  }
}

// Calculate and display statistics
const statistics = calculateTodoStatistics(todos);
displayTodoStatistics(statistics);


ReactDOM.render(<Root />, document.getElementById("root"));
// # 앱 세팅 끝
