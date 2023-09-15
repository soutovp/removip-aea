import footer from '../styles/components/footer.module.sass'
import Image from "next/image";
export default function Footer() {
	return (
		<footer className={footer.footer}>
			<div>
				<aside>
					<img src="/images/removiplogo.png" alt="Logo da Removip" />
					<p>A removip é uma empresa especializada em locação de ambulâcias, remoção de pacientes e cobertura médica de eventos</p>
				</aside>
				<hr />
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
			</div>
			<div>
				<p>desenvolvido por <strong><a href="https://aeaagencia.com/" target='_blank'>a&a agência criativa</a></strong></p>
				<a href="https://aeaagencia.com/" target='_blank'>
					<span><Image
						src={'/svg/logo-a-e-a.svg'}
						width={30}
						height={30}
						alt="Logo da agência A&A"
					/></span>
				</a>
			</div>
		</footer>
	)
}