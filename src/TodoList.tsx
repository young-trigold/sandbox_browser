import {
  ChangeEventHandler,
  CompositionEventHandler,
  Dispatch,
  FunctionComponent,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import style from './TodoList.module.less';

interface isRelatedFunc {
  (text1: string, text2: string): boolean;
  cache?: Map<string, boolean>;
}

const isRelated: isRelatedFunc = (text1, text2) => {
  const join = '===trigoldJoin===';
  const key = `${text1}${join}${text2}`;
  if (!isRelated.cache) {
    isRelated.cache = new Map();
  }
  if (isRelated.cache.has(key)) return isRelated.cache.get(key)!;
  if (!text1) {
    isRelated.cache.set(key, true);
    return true;
  }
  const result = [...text2].some((char) => text1.includes(char));
  isRelated.cache.set(key, result);
  return result;
};

const urlSearchParamsToObject = (urlSearchParams: URLSearchParams) => {
  const urlSearchParamsAsObject = [...urlSearchParams.entries()].reduce((result, [key, value]) => {
    result[key] = value;
    return result;
  }, {} as Record<string, string>);
  return urlSearchParamsAsObject;
};

const formatDate = (date?: string) => {
  let d = new Date();

  if (date) {
    d = new Date(date);
  }

  let month = '' + (d.getMonth() + 1),
    day = '' + d.getDate(),
    year = d.getFullYear();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;

  return [year, month, day].join('-');
};

const getUniqueId = (() => {
  let count = 0;
  return () => (Math.random() + count++).toString(32);
})();

interface TodoItem {
  id: string;
  title: string;
  detail?: string;
  deadline: string;
  createTime: string;
  done?: boolean;
  isRelatedToSearchWord?: boolean;
}

interface AddTodoItemDialogProps {
  visible: boolean;
  onOk: () => void;
  onCancel: () => void;
}

const TodoListContext = createContext<{
  setTodoItems: Dispatch<React.SetStateAction<TodoItem[]>>;
  searchParams: URLSearchParams;
}>({} as any);

const AddTodoItemDialog: FunctionComponent<AddTodoItemDialogProps> = (props) => {
  const { visible, onOk, onCancel } = props;

  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');
  const [deadline, setDeadline] = useState('');

  const onTitleFieldChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    const { value } = event.target;
    setTitle(value);
  };

  const onDetailFieldChange: ChangeEventHandler<HTMLTextAreaElement> = (event) => {
    const { value } = event.target;
    setDetail(value);
  };

  const onDeadlineFieldChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    const { value } = event.target;
    setDeadline(value);
  };

  const { setTodoItems, searchParams } = useContext(TodoListContext);

  const searchWord = searchParams.get('searchWord')!;

  const onOkButtonClick = () => {
    setTodoItems((oldTodoItems) => {
      const newTodoItem: TodoItem = {
        id: getUniqueId(),
        title,
        detail,
        deadline,
        createTime: formatDate(),
        done: false,
        isRelatedToSearchWord: isRelated(searchWord, title) || isRelated(searchWord, detail ?? ''),
      };
      const newTodoItems = [...oldTodoItems, newTodoItem];
      return newTodoItems;
    });
    onOk();
  };

  const onCancelButtonClick = () => {
    onCancel();
  };

  if (!visible) return null;

  return createPortal(
    <div className={style.AddTodoItemModalMask}>
      <form className={style.AddTodoItemModalContainer}>
        <div className={style.FieldContainer}>
          <label htmlFor="title">事项名称</label>
          <input required type="text" id="title" value={title} onChange={onTitleFieldChange} />
        </div>
        <div className={style.FieldContainer}>
          <label htmlFor="detail">详细说明</label>
          <textarea id="detail" value={detail} onChange={onDetailFieldChange} />
        </div>
        <div className={style.FieldContainer}>
          <label htmlFor="deadline">截至日期</label>
          <input
            required
            type="date"
            id="deadline"
            value={deadline}
            onChange={onDeadlineFieldChange}
          />
        </div>
        <footer className={style.AddTodoItemModalFooter}>
          <button type="button" onClick={onCancelButtonClick}>
            取消
          </button>
          <button type="submit" className="primary" onClick={onOkButtonClick}>
            确定
          </button>
        </footer>
      </form>
    </div>,
    document.body,
  );
};

interface TodoItemProps {
  todoItem: TodoItem;
  index: number;
}

const TodoItem: FunctionComponent<TodoItemProps> = (props) => {
  const { todoItem, index } = props;
  const { id, title, detail, deadline, createTime, done, isRelatedToSearchWord } = todoItem;

  const { setTodoItems } = useContext(TodoListContext);

  const onDeleteButtonClick = () => {
    setTodoItems((oldTodoItems) => {
      const index = oldTodoItems.findIndex((todoItem) => todoItem.id === id);
      const newTodoItems = [...oldTodoItems];
      newTodoItems.splice(index, 1);
      return newTodoItems;
    });
  };

  const updateTodoItem: (id: string, update: (oldTodoItem: TodoItem) => TodoItem) => void = (
    id,
    update,
  ) => {
    setTodoItems((oldTodoItems) => {
      const index = oldTodoItems.findIndex((todoItem) => todoItem.id === id);
      const newTodoItem = update(oldTodoItems[index]);
      const newTodoItems = [...oldTodoItems];
      newTodoItems.splice(index, 1, newTodoItem);
      return newTodoItems;
    });
  };

  const onDoneButtonClick = () => {
    updateTodoItem(id, (oldTodoItem) => ({ ...oldTodoItem, done: !oldTodoItem.done }));
  };

  const onTitleFieldChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    const { value } = event.target;
    updateTodoItem(id, (oldTodoItem) => ({ ...oldTodoItem, title: value }));
  };

  const onDetailFieldChange: ChangeEventHandler<HTMLTextAreaElement> = (event) => {
    const { value } = event.target;
    updateTodoItem(id, (oldTodoItem) => ({ ...oldTodoItem, detail: value }));
  };

  const onDeadlineFieldChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    const { value } = event.target;
    updateTodoItem(id, (oldTodoItem) => ({ ...oldTodoItem, deadline: value }));
  };

  const onCreateTimeFieldChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    const { value } = event.target;
    updateTodoItem(id, (oldTodoItem) => ({ ...oldTodoItem, createTime: value }));
  };

  return (
    <tr
      style={{
        ...(isRelatedToSearchWord ? {} : { display: 'none' }),
        opacity: done ? 0.5 : 'unset',
      }}
    >
      <td align="center">
        <p>{index + 1}</p>
      </td>
      <td>
        <input type="text" id={`title-${id}`} value={title} onChange={onTitleFieldChange} />
      </td>
      <td align="center">
        <textarea id={`detail-${id}`} value={detail} onChange={onDetailFieldChange} />
      </td>
      <td align="center">
        <input
          type="date"
          id={`deadline-${id}`}
          value={deadline}
          onChange={onDeadlineFieldChange}
        />
      </td>
      <td align="center">
        <input
          type="date"
          id={`createTime-${id}`}
          value={createTime}
          onChange={onCreateTimeFieldChange}
        />
      </td>
      <td width={200} align="center">
        <div style={{ width: '100%', display: 'flex', gap: '1em' }}>
          <button type="button" onClick={onDoneButtonClick}>
            已完成
          </button>
          <button type="button" onClick={onDeleteButtonClick}>
            删除
          </button>
        </div>
      </td>
    </tr>
  );
};

export const TodoList = () => {
  const key = 'todoItems';
  const initialTodoItems = JSON.parse(window.localStorage.getItem(key) ?? '[]') as TodoItem[];
  const [todoItems, setTodoItems] = useState(initialTodoItems);

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(todoItems));
  }, [todoItems]);

  const disabled = todoItems.length === 0;
  const [addTodoItemDialogVisible, setAddTodoItemDialogVisible] = useState(false);

  const onAddTodoItemButtonClick = () => {
    setAddTodoItemDialogVisible(true);
  };

  const onAddTodoItemDialogOk = () => {
    setAddTodoItemDialogVisible(false);
  };

  const onAddTodoItemDialogCancel = () => {
    setAddTodoItemDialogVisible(false);
  };

  const [searchParams, setSearchParams] = useSearchParams({
    searchWord: '',
    sortBy: '',
  });

  const sortBy = searchParams.get('sortBy') ?? '';

  useEffect(() => {
    if (sortBy === 'deadline') {
      setTodoItems((oldTodoItems) => {
        const newTodoItems = [...oldTodoItems].sort(
          (todoItemA, todoItemB) =>
            Number(new Date(todoItemA.deadline)) - Number(new Date(todoItemB.deadline)),
        );
        return newTodoItems;
      });
    } else if (sortBy === 'createTime') {
      setTodoItems((oldTodoItems) => {
        const newTodoItems = [...oldTodoItems].sort(
          (todoItemA, todoItemB) =>
            Number(new Date(todoItemA.createTime)) - Number(new Date(todoItemB.createTime)),
        );
        return newTodoItems;
      });
    }
  }, [sortBy]);

  const onSortByDeadlineButtonClick = () => {
    setSearchParams((oldSearchParams) => {
      return {
        ...urlSearchParamsToObject(oldSearchParams),
        sortBy: 'deadline',
      };
    });
  };

  const onSortByCreateTimeButtonClick = () => {
    setSearchParams((oldSearchParams) => {
      return {
        ...urlSearchParamsToObject(oldSearchParams),
        sortBy: 'createTime',
      };
    });
  };

  const searchWord = searchParams.get('searchWord') ?? '';

  useEffect(() => {
    console.debug('searchword', searchWord);
    setTodoItems((oldTodoItems) => {
      const newTodoItems = [...oldTodoItems].map((todoItem) => ({
        ...todoItem,
        isRelatedToSearchWord:
          isRelated(searchWord, todoItem.title) || isRelated(searchWord, todoItem.detail ?? ''),
      }));
      return newTodoItems;
    });
  }, [searchWord]);

  const isCompositionEndRef = useRef(false);

  const onSearchWordFieldChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    if (!isCompositionEndRef.current) return;
    // console.debug('change', event.target.value);
    const { value } = event.target;
    setSearchParams((oldSearchParams) => {
      return {
        ...urlSearchParamsToObject(oldSearchParams),
        searchWord: value,
      };
    });
  };

  const onSearchWordFieldCompositionStart: CompositionEventHandler<HTMLInputElement> = (event) => {
    // console.debug('start', event.data);
    isCompositionEndRef.current = false;
  };

  const onSearchWordFieldCompositionEnd: CompositionEventHandler<HTMLInputElement> = (event) => {
    // console.debug('end', event.data);
    isCompositionEndRef.current = true;
    setSearchParams((oldSearchParams) => {
      return {
        ...urlSearchParamsToObject(oldSearchParams),
        searchWord: event.data,
      };
    });
  };

  return (
    <TodoListContext.Provider value={{ setTodoItems, searchParams }}>
      <form className={style.TodoListContainer}>
        <header className={style.TodoListHeader}>
          <input
            type="search"
            placeholder="搜索事项名称或详细说明"
            disabled={disabled}
            onChange={onSearchWordFieldChange}
            onCompositionStart={onSearchWordFieldCompositionStart}
            onCompositionEnd={onSearchWordFieldCompositionEnd}
          />
          <button type="button" disabled={disabled} onClick={onSortByDeadlineButtonClick}>
            按截至日期排列
          </button>
          <button type="button" disabled={disabled} onClick={onSortByCreateTimeButtonClick}>
            按创建日期排列
          </button>
        </header>
        <main className={style.TodoListMainContainer}>
          {disabled ? (
            <h1>您还没有创建代办事项！</h1>
          ) : (
            <table className={style.TodoListTable}>
              <thead>
                <tr>
                  <th>序号</th>
                  <th>事项名称</th>
                  <th>详细说明</th>
                  <th>截至时间</th>
                  <th>创建时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {todoItems.map((todoItem, index) => (
                  <TodoItem key={todoItem.id} index={index} todoItem={todoItem} />
                ))}
              </tbody>
            </table>
          )}
        </main>
        <button
          type="button"
          className={`${style.AddTodoItemButton} primary`}
          onClick={onAddTodoItemButtonClick}
        >
          添加事项
        </button>
        <AddTodoItemDialog
          visible={addTodoItemDialogVisible}
          onOk={onAddTodoItemDialogOk}
          onCancel={onAddTodoItemDialogCancel}
        />
      </form>
    </TodoListContext.Provider>
  );
};
