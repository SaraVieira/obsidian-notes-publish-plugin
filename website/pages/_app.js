import { useEffect, useState } from 'react'
import { Moon, Sun } from '../Components/Icons'
import { useLocalStorage } from '../gooks/useLocalStorage'
import '../styles/globals.css'

function MyApp({ Component, pageProps }) {
	const [dark, setDark] = useLocalStorage('dark-mode', false)
	const [settings, setSettings] = useState('')

	useEffect(() => {
		setSettings(dark ? 'dark' : '')
	}, [dark])

	return (
		<div data-typesettings={settings}>
			<header>
				<button
					className="theme-switcher"
					onClick={() => setDark((d) => !d)}
				>
					{dark ? <Sun width="24" /> : <Moon width="24" />}
				</button>
			</header>
			<main>
				<Component {...pageProps} />
			</main>
		</div>
	)
}

export default MyApp
