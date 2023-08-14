import * as React from "react"

interface ErrorContext {
    error?: unknown
    setError: (error?: unknown) => void
}

interface ErrorState {
    error?: unknown
}

const errorContext = React.createContext<ErrorContext>({
    setError: (error) => console.error(error),
})

export const useErrorContext = () => React.useContext(errorContext)

export default class ErrorBoundary extends React.Component<
    { children: React.ReactNode; fallback: React.ReactNode },
    ErrorState
> {
    constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
        super(props)

        this.state = {
            error: undefined,
        }
    }

    render() {
        const { error } = this.state

        if (error) {
            console.error(error)
            return this.props.fallback
        }

        const setError: ErrorContext["setError"] = (error) => this.setState({ error })

        return (
            <errorContext.Provider
                value={{
                    error,
                    setError,
                }}
            >
                {this.props.children}
            </errorContext.Provider>
        )
    }

    static getDerivedStateFromError(error: Error): ErrorState {
        return {
            error,
        }
    }
}
