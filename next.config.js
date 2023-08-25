const path = require('path')

module.exports = {
	experimental: {
		// serverActions: true,
		//appDir: true,
	},
	sassOptions: {
		includePaths: [path.join(__dirname, 'styles')],
	},
}