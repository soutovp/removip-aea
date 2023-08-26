import Image from "next/image"
export default function Banner(props) {
	let page = props.page
	return (
		<>
			<div className="classAlgumaCoisa">
				<Image
					src={'/images/bg-ambulancias.jpg'}
					alt={page}
					width={1156}
					height={356}
					style={{
						display: 'block'
					}}
				/>
			</div>
		</>
	)
}