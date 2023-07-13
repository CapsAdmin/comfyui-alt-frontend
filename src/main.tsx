import React from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import ReactDOM from 'react-dom/client'
import { Editor } from './components/Editor.tsx'
import { CustomWorkflowPage } from './CustomWorkflow.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  
  <React.StrictMode>
    <DndProvider backend={HTML5Backend}>
    <CustomWorkflowPage />
    </DndProvider>

  </React.StrictMode>,
)
