import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import dark from 'react-syntax-highlighter/dist/cjs/styles/prism/vs-dark'

export function Code({ node, inline, className, children, ...props }) {
	const match = /language-(\w+)/.exec(className || '')
	const languageProp = {
		language: match ? match[1] : null,
	}
	return !inline ? (
		<SyntaxHighlighter
			children={String(children).replace(/\n$/, '')}
			style={dark}
			PreTag="div"
			{...props}
			{...languageProp}
		/>
	) : (
		<code className={className} {...props}>
			{children}
		</code>
	)
}
