module.exports = {
    assetsDir: undefined,
    publicPath: '',
    outputDir: undefined,
    runtimeCompiler: undefined,
    productionSourceMap: undefined,
    parallel: undefined,
    css: undefined,
    devServer: {
        disableHostCheck: true,
        proxy: {
            '/api': { // 转发路径
                target: 'http://music.jsososo.com', // 目标地址
                headers: {
                    Host: 'music.jsososo.com'
                }
            },
            '/apiQ': { // 转发路径
                target: 'http://music.jsososo.com', // 目标地址
                headers: {
                    Host: 'music.jsososo.com'
                }
            }
        }
    }
}
