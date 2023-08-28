import { Souto } from "../home/page";
import '../styles/components/footer.sass'
import Image from "next/image";
export default function Footer() {
	return (
		<>
			<section className="footer">
				<main>
					<aside>
						<Image
							src={'/svg/logo-removip-icone.svg'}
							width={200}
							height={50}
							alt="Logo Removip"
						/>
						<p>A removip é uma empresa especializada em locação de ambulâcias, remoção de pacientes e cobertura médica de eventos</p>
					</aside>
					<div>
						<div></div>
					</div>
					<aside>
						<div>
							<p>Rua João Torquato, 248</p>
							<p>Bomsucesso - Rio de Janeiro - RJ</p>
							<p>CEP 21032-150</p>
						</div>
						<div>
							<p>removip@removip.com.br</p>
							<p>(21)3040-2666</p>
						</div>
					</aside>
				</main>
			</section>
			<footer>
				<p>desenvolvido por <strong>a&a agência criativa</strong></p>
				<span><Image
					src={'/svg/logo-a-e-a.svg'}
					width={30}
					height={30}
					alt="Logo da agência A&A"
				/></span>
			</footer>
		</>
	)
}