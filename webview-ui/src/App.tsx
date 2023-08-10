import { useState } from "react";
import List from "./components/List";
import Form from "./components/Form";
import { Type } from "./enums";
import { IRoute } from "./types";

import "./App.css";

function App() {
  const [route, setRoute] = useState<IRoute>({
    type: Type.list,
  });

  switch (route.type) {
    case Type.list:
      return <List changeRoute={setRoute} />;
    default:
      return <Form changeRoute={setRoute} id={route.id} />;
  }
}

export default App;
