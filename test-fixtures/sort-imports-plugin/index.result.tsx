import React, { useState } from "react"
import ReactDOM from "react-dom"
import axios from "axios"
import { Button } from "./components/Button"

const App = () => {
  const [count, setCount] = useState(0)
  return <Button onClick={() => setCount(count + 1)}>Count: {count}</Button>
}

ReactDOM.render(<App />, document.getElementById("root"))
