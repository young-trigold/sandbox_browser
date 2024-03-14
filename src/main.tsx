import { createRoot } from 'react-dom/client';
import { TodoList } from './TodoList';
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import './index.less';

const router = createBrowserRouter([
  {
    path: "*",
    element: <TodoList />
  },
]);

const App = () => {
  return <RouterProvider router={router} />
};

createRoot(document.getElementById('root')!)
  .render(<App></App>);
