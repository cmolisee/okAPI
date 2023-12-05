import type { Configuration } from 'webpack';

module.exports = {
    entry: { 
        background: 'src/chromeServices/backgroundScript.ts',
        contentCommunication: 'src/chromeServices/contentScriptCommunication.ts'
    },
} as Configuration;