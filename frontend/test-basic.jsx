import React from 'react'
import ReactDOM from 'react-dom/client'

function TestApp() {
  return (
    <div>
      <h1>测试应用</h1>
      <p>如果你看到这个页面，说明基本的React渲染是正常的</p>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <TestApp />
  </React.StrictMode>
)