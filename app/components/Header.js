import Image from "next/image"
export default function Header() {
	return (
		<header>
			<nav class="headerNav widthLimitation">
				<div>
					<Image
						src={'/svg/removip-logo-header.svg'}
						width={120}
						height={50}
						alt="Logo Removip"
					/>
				</div>
				<div>
					<ul class='headerMenu'>
						<li>
							<a class="headerActiveLink" href="#">Home</a>
						</li>
						<li>
							<a href="#">Sobre</a>
						</li>
						<li>
							<a href="#">Serviços</a>
						</li>
						<li>
							<a href="#">Blog</a>
						</li>
						<li>
							<a href="#">Contato</a>
						</li>
					</ul>
				</div>
				<div>
					<ul class="headerRedes">
						<li>
							<a href="https://www.instagram.com/removip_/" target="_blank" rel="noopener noreferrer">
								<Image src={'/svg/instagram.svg'} width={32} height={32} alt="Link para o Instagram" />
							</a>
						</li>
						<li>
							<a href="https://whatsa.me/5521970769075/?t=Ol%C3%A1" target="_blank"
								rel="noopener noreffer">
								<Image src={'/svg/whatsapp.svg'} width={32} height={32} alt="Link para o Whatsapp" />
							</a>
						</li>
					</ul>
				</div>
			</nav>
		</header>
	)
}