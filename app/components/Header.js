'use client'
import Image from "next/image"
import React, { useEffect, useState } from "react"
import Link from "next/link"
export default function Header() {
	const [openMenu, setMenuOpen] = useState(false)
	const [colorButton, setButtonColor] = useState('#1e1814')
	const [buttonAppear, setButtonAppear] = useState('none')
	useEffect(() => {
		if (window.innerWidth < 769) {
			setButtonAppear('block')
		} else {
			setButtonAppear('none')
		}
	}, [window.innerWidth])
	window.addEventListener('resize', () => {
		if (window.innerWidth > 769) {
			setButtonAppear('block')
		} else {
			setButtonAppear('none')
		}
	})
	const toggleMenu = () => {
		const button = document.getElementById('hamburger')
		if (window.innerWidth < 769) {
			setMenuOpen(!openMenu)
		} else {
			setMenuOpen(true)
			setButtonColor('white')

		}
	}
	return (
		<>
			<button id={"hamburger"} style={{ display: buttonAppear, color: colorButton }} onClick={toggleMenu}>
				<svg width="32px" height="32px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path d="M20 7L4 7" stroke="#791B28" strokeWidth="1.5" strokeLinecap="round" />
					<path d="M20 12L4 12" stroke="#791B28" strokeWidth="1.5" strokeLinecap="round" />
					<path d="M20 17L4 17" stroke="#791B28" strokeWidth="1.5" strokeLinecap="round" />
				</svg>
			</button>
			<header id="menu" style={{ transform: openMenu ? 'translateX(0)' : 'translateX(0)' }}>
				<nav className="headerNav widthLimitation">
					<div>
						<Image
							src={'/svg/removip-logo-header.svg'}
							width={120}
							height={50}
							alt="Logo Removip"
						/>
					</div>
					<div>
						<ul className='headerMenu'>
							<li>
								<Link className="headerActiveLink" href="/" onClick={toggleMenu}>Home</Link>
							</li>
							<li>
								<Link href="sobre">Sobre</Link>
							</li>
							<li>
								<Link href="servicos">Serviços</Link>
							</li>
							<li>
								<Link href="#">Blog</Link>
							</li>
							<li>
								<Link href="contato">Contato</Link>
							</li>
						</ul>
					</div>
					<div>
						<ul className="headerRedes">
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
		</>
	)
}