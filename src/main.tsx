import { ThemeProvider } from "@emotion/react"
import { CssBaseline, createTheme } from "@mui/material"
import { Suspense } from "react"
import { DndProvider } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import ReactDOM from "react-dom/client"
import { CustomWorkflowPage } from "./CustomWorkflowPage.tsx"
const darkTheme = createTheme({
    palette: {
        mode: "dark",
    },
})

ReactDOM.createRoot(document.getElementById("root")!).render(
    <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <DndProvider backend={HTML5Backend}>
            <Suspense fallback={<div>loading rates</div>}>
                <CustomWorkflowPage />
            </Suspense>
        </DndProvider>
    </ThemeProvider>
)
