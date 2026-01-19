import { useState } from "react"
import ReactDOM from "react-dom"
import React from "react"
import { Button } from "./components/Button"
import axios from "axios"

const App = () => {
  const [count, setCount] = useState(0)
  return <Button onClick={() => setCount(count + 1)}>Count: {count}</Button>
}

ReactDOM.render(<App />, document.getElementById("root"))
