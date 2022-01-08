import gfm from 'remark-gfm'
import Airtable from 'airtable-plus'
import Head from 'next/head'
import remarkInlineLinks from 'remark-inline-links'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import { Code } from '../../components/Code'

export default function Note({ note }) {
	return (
		<>
			<Head>
				<title>{note.title}</title>
			</Head>

			<h1>{note.title}</h1>
			<small>
				<time>
					Created on{' '}
					{new Date(note.createdAt).toLocaleDateString('en-US', {
						weekday: 'long',
						year: 'numeric',
						month: 'long',
						day: 'numeric',
					})}
				</time>
			</small>
			<ReactMarkdown
				remarkPlugins={[remarkInlineLinks, gfm]}
				rehypePlugins={[rehypeRaw]}
				components={{ code: Code }}
				renderers={{
					link: (props) => {
						return props.href.startsWith('/') ? (
							<a href={props.href}>{props.children}</a>
						) : (
							<a
								href={props.href}
								target="_blank"
								rel="nofollow noopener noreferrer"
							>
								{props.children}
							</a>
						)
					},
				}}
			>
				{note.data}
			</ReactMarkdown>
		</>
	)
}
export async function getServerSideProps({ query }) {
	const { AIRTABLEAPIKEY, AIRTABLEBASE, AIRTABLEVIEW } = process.env
	const base = new Airtable({
		baseID: AIRTABLEBASE,
		apiKey: AIRTABLEAPIKEY,
		tableName: AIRTABLEVIEW,
	})

	const records = await base.read({
		filterByFormula: `{slug} = '${query.slug}'`,
		maxRecords: 1,
	})

	return {
		props: { note: records[0].fields },
	}
}
