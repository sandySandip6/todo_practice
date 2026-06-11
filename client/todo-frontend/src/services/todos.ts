import api from "./api";

export const getTodos = async (token: string) => {
  try {
    const response = await api.get(`/todos/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching todos:", error);
  }
};

export const createTodo = async (
  token: string,
  title: string,
  description: string,
) => {
  try {
    const response = await api.post(`/todos/`,
      { title, description },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return response.data;
  } catch (error) {
    console.error("Error creating todo:", error);
  }
};

export const updateTodo = async(token: string, title: string, description: string, completed: boolean, id: number) => {
    try {
        const response = await api.patch(`/todos/${id}/`,
            {id, title, description, completed},
            {
                headers: {Authorization: `Bearer ${token}`}
            }
        );
        return response.data;

    }
    catch (error){
        console.error("Error updating todo:", error);
    }
}

export const deleteTodo = async(token: string, id: number) => {
    try {
        const response = await api.delete(`/todos/${id}/`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        console.error("Error deleting todo:", error);
    }
}