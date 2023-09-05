const express = require("express");
const app = express();

const { open } = require("sqlite");
const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");
const sqlite3 = require("sqlite3");
const isValid = require("date-fns/isValid");
const isMatch = require("date-fns/isMatch");
const format = require("date-fns/format");

let db = null;

const initializeDatabaseAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
  } catch (error) {
    console.log(`DataBase Error ${error.message}`);
    process.exit(1);
  }
};

initializeDatabaseAndServer();

app.listen(3000, () => {
  console.log("server is running");
});
const result = (each) => {
  return {
    id: each.id,
    todo: each.todo,
    priority: each.priority,
    status: each.status,
    category: each.category,
    dueDate: each.due_date,
  };
};

const toCheckStatus = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const toCheckPriority = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const toCheckPriorityAndStatus = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const toCheckCategory = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const toCheckSearchQuery = (requestQuery) => {
  return requestQuery.search_q !== undefined;
};

const toCheckPriorityAndCategory = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.category !== undefined
  );
};

const toCheckCategoryAndStatus = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

// GETTING FROM TODO

app.get("/todos/", async (request, response) => {
  const { search_q = "", priority, status, category } = request.query;
  let getTodoQuery;
  let data;

  switch (true) {
    case toCheckStatus(request.query):
      if (status === "TO DO" || status === "IN PROCESS" || status === "DONE") {
        getTodoQuery = `SELECT * FROM todo
                WHERE status='${status}'`;
        data = await db.all(getTodoQuery);

        response.send(data.map((each) => result(each)));
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case toCheckPriority(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        getTodoQuery = `SELECT * FROM todo 
                    WHERE priority='${priority}'`;
        data = await db.all(getTodoQuery);
        response.send(data.map((each) => result(each)));
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case toCheckPriorityAndStatus(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        if (
          status === "TO DO" ||
          status === "IN PROCESS" ||
          status === "DONE"
        ) {
          getTodoQuery = `SELECT * FROM todo
                WHERE priority='${priority}' AND
                       status='${status}';`;
          data = await db.all(getTodoQuery);
          response.send(data.map((each) => result(each)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case toCheckSearchQuery(request.query):
      getTodoQuery = `SELECT * FROM todo
          WHERE todo LIKE '%${search_q}%'`;
      data = await db.all(getTodoQuery);
      response.send(data.map((each) => result(each)));

      break;
    case toCheckCategoryAndStatus(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          status === "TO DO" ||
          status === "IN PROCESS" ||
          status === "DONE"
        ) {
          getTodoQuery = `SELECT * FROM todo 
                   WHERE status='${status} and category='${category}'`;
          data = await db.all(getTodoQuery);
          response.send(data.map((each) => result(each)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case toCheckCategory(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        getTodoQuery = `SELECT * FROM todo 
                   WHERE category='${category}'`;
        data = await db.all(getTodoQuery);
        response.send(data.map((each) => result(each)));
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case toCheckPriorityAndCategory(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          priority === "HIGH" ||
          priority === "MEDIUM" ||
          priority === "LOW"
        ) {
          getTodoQuery = `SELECT * FROM todo 
                  WHERE priority='${priority}' AND category='${category}'`;
          data = await db.all(getTodoQuery);
          response.send(data.map((each) => result(each)));
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    default:
      getTodoQuery = `SELECT * FROM todo`;
      data = await db.all(getTodoQuery);
      response.send(data.map((each) => result(each)));
      break;
  }
});

//GETTING PARTICULAR API

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getParticularBookQuery = `SELECT * FROM todo WHERE id='${todoId}'`;
  const data = await db.get(getParticularBookQuery);
  response.send(result(data));
});

//GETTING AGENDA

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  if (isMatch(date, "yyyy-MM-dd")) {
    const newDate = format(new Date(date), "yyyy-MM-dd");
    const requestQuery = `SELECT * FROM todo
                     WHERE due_date='${newDate}'`;
    const responseResult = await db.all(requestQuery);
    response.send(responseResult.map((each) => result(each)));
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

//POST TODO

app.post("/todos/", async (request, response) => {
  const { id, todo, category, priority, status, dueDate } = request.body;
  if (status === "TO DO" || status === "IN PROCESS" || status === "DONE") {
    if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          const newDate = format(new Date(dueDate), "yyyy-MM-dd");
          const postQuery = `INSERT INTO todo 
            (id,todo,category,priority,status,due_date)
            VALUES (
                ${id},
                '${todo}',
                '${category}',
                '${priority}',
                '${status}',
                '${newDate}'
            )`;
          await db.run(postQuery);
          response.status(200);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Status");
  }
});

//UPDATE TODO

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const requestBody = request.body;
  const checkUserQuery = `SELECT * FROM todo 
    WHERE id=${todoId}`;
  const checkUser = await db.get(checkUserQuery);
  const {
    todo = checkUser.todo,
    priority = checkUser.priority,
    status = checkUser.status,
    category = checkUser.category,
    dueDate = checkUser.dueDate,
  } = request.body;
  let updateQuery;
  switch (true) {
    case requestBody.status !== undefined:
      if (status === "TO DO" || status === "IN PROCESS" || status === "DONE") {
        updateQuery = `UPDATE todo
                SET 
                    status='${status}',
                    priority='${priority}',
                    status='${status}',
                    category='${category}',
                    due_date='${dueDate}'
                WHERE id=${todoId}`;
        await db.run(updateQuery);
        response.send("Status Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case requestBody.priority !== undefined:
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        updateQuery = `UPDATE todo
                SET status='${status}',
                priority='${priority}',
                status='${status}',
                category='${category}',
                due_date='${dueDate}'
                WHERE id=${todoId}`;
        await db.run(updateQuery);
        response.send("Priority Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    case requestBody.todo !== undefined:
      updateQuery = `UPDATE todo
                SET status='${status}',
                priority='${priority}',
                status='${status}',
                category='${category}',
                due_date='${dueDate}'
                WHERE id=${todoId}`;
      await db.run(updateQuery);
      response.send("Todo Updated");
      break;
    case requestBody.category !== undefined:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        updateQuery = `UPDATE todo
                SET 
                category='${category}'
                
                WHERE id=${todoId}`;
        await db.run(updateQuery);
        response.send("Category Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case requestBody.dueDate !== undefined:
      if (isMatch(dueDate, "yyyy-MM-dd")) {
        const newDate = format(new Date(dueDate), "yyyy-MM-dd");
        updateQuery = `UPDATE todo
                SET status='${status}',
                priority='${priority}',
                status='${status}',
                category='${category}',
                due_date='${newDate}'
                WHERE id=${todoId}`;
        await db.run(updateQuery);
        response.send("Due Date Updated");
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;
  }
});

//DELETE TODO

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `DELETE FROM todo
    WHERE id=${todoId}`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
