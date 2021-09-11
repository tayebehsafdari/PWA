module.exports = {
	globDirectory: 'public/',
	globPatterns: [
		'**/*.{html,json,js,css,ico,png}'
	],
	ignoreURLParametersMatching: [
		/^utm_/,
		/^fbclid$/,
		/^source=pwa/
	],
	swDest: 'public/sw.js'
};