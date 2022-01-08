import Airtable from 'airtable-plus'
import Link from 'next/link'
const Home = ({ notes }) => {
	return (
		<>
			<h1 style={{ textAlign: 'center' }}>Your notes, shared</h1>
			<ul>
				<li>
					{notes.map((note) => (
						<li>
							<Link href={`notes/${note.slug}`}>
								<a>{note.title}</a>
							</Link>
						</li>
					))}
				</li>
			</ul>
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
		filterByFormula: `{password} = ''`,
	})

	return {
		props: {
			notes: records
				.filter((r) => r.fields.slug)
				.map(({ fields: record }) => ({
					slug: record.slug,
					title: record.title,
					createdAt: record.createdAt,
				})),
		},
	}
}
export default Home
