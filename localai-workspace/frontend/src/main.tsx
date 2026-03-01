import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'

import { AppLayout } from './components/layout/AppLayout.tsx'
import { Dashboard } from './pages/Dashboard.tsx'
import { Confirmation } from './pages/Confirmation.tsx'
import { Kanban } from './pages/Kanban.tsx'
import { ResearchCopilot } from './pages/ResearchCopilot.tsx'
import { LiveMeeting } from './pages/LiveMeeting.tsx'
import { CalendarPage } from './pages/CalendarPage.tsx'

const router = createBrowserRouter([
    {
        path: "/",
        element: <AppLayout />,
        children: [
            {
                path: "/",
                element: <Dashboard />,
            },
            {
                path: "/confirmation",
                element: <Confirmation />,
            },
            {
                path: "/board",
                element: <Kanban />,
            },
            {
                path: "/calendar",
                element: <CalendarPage />,
            },
            {
                path: "/copilot",
                element: <ResearchCopilot />,
            },
            {
                path: "/meeting",
                element: <LiveMeeting />,
            }
        ]
    }
])

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <RouterProvider router={router} />
    </StrictMode>,
)
