import style from './styles/style.sass'
import Header from './components/Header'
import Image from 'next/image'
export default function Page() {
	return (<>
		<Header />
		<main>
			<div class="bgAmbulancias">
				<Image
					src={'/images/bg-ambulancias.jpg'}
					width={1000}
					height={1000}
				/>
			</div>
		</main>
	</>)
}