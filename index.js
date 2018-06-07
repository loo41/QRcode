/**
 * @class QRcode  二维码生成类
 * @class Info    二维码信息类
 * @class Tool    二维码工具类
 * 
 */
class Info {
    constructor () {
        this.mode = []                    // 生成字符串关系映射表数组
        this.versionMode = {}             // 版本对应的编码的位
        this.sign = {}                    // 编码对应的标志
        this.versionInfo = []

        /** init method */
        this.initAlpMod()
        this.initVersionMode()
        this.initSign()
        this.initVersionInfo()                   
    }

    // ---------------------------------------
    /*           初始化版本信息              */
    // ---------------------------------------

    initVersionInfo () {

        /**
         * 数组下标对应版本 
         * @param codeTotal    码字总数
         * @param errorGrade   错误等级对应 L M Q H 四个版本[纠错码字数, 纠错码块数, 纠错代码]
         * 
         */

        this.versionInfo.push({codeTotal: 26, errorGrade: [
            [7, 1, [26, 19, 2]], [10, 1, [26, 16, 4]], [13, 1, [26, 13, 6]], [17, 1, [26, 9, 8]]
        ]})
    }

    initSign () {
        this.sign.eCI = '0111'
        this.sign.numeric = '0001'
        this.sign.alphanumeric = '0010'
        this.sign.byte = '0100'
        this.sign.kanji = '1000'
    }

    initVersionMode () {

        /** [1~9版本对应编码位数, 10~26版本对应编码位数, 27~40版本对于编码位数] */
        
        Object.defineProperties(this.versionMode, {
            'numericMode': {
                value: [10, 12, 14],                    // 数字
                enumerable: true,
                writable: false
            },
            'alphanumericMode': {
                value: [9, 11, 13],                     // 字符
                enumerable: true,
                writable: false
            },
            'byteMode': {
                value: [8, 16, 16],                     // 字节
                enumerable: true,
                writable: false
            },
            'kanjiMode': {
                value: [8, 10, 12],                     // 日文
                enumerable: true,
                writable: false
            }
        })
    }
    initAlpMod () {
        for (let i = 0; i <= 9; i++) {
            this.mode.push(i.toString())
        }
        for (let i = 0; i < 26; i++) {
            this.mode.push(String.fromCharCode(65 + i))
        }
        this.mode.push('SP', '$', '%', '*', '+', '-', '.', '/', ':')
    }
}


/**
 * @method createbits            生成数字编码位
 * @method alphanumericMode      获取字符对应的值
 * @method getVersionMode        获取版本对应的编码位数
 * 
 */

class Tool extends Info {
    constructor () { 
        super()
    }
    createbits (mode, data) {
        if (!mode) return data.toString(2)
        return data.toString(2).padStart(mode, '0')
    }
    alphanumericMode (char) {
        return this.mode.indexOf(char.toUpperCase())
    }
    getVersionMode (version, type) {
        if (!this.versionMode[type]) {
            new Error('类型错误')
        }
        if (version > 0 && version < 10) {
            return this.versionMode[type][0]
        } else if (version > 10 && version < 26) {
            return this.versionMode[type][1]
        } else {
            return this.versionMode[type][2]
        }
    }
    getSign (type) {
        return this.sign[type] 
    }
    getCodeMath (vs, type) {
        if (type === 'L') type = 0
            else if (type === 'M') type = 1
            else if (type === 'Q') type = 2
            else type = 3
        return this.versionInfo[vs - 1].errorGrade[type][2][0]
    }
}

class QRcode extends Tool {
    constructor ({data = '', version = 1, correctLevel = 'L'}) {
        super()
        this.data = data                                       // 编码的数据
        this.version = version                                 // 二维码版本
        this.codeValue = ''                                    // 编码后数据
        this.strIndexVlaue = []                                // 字符转换数据
        this.correctLevel = correctLevel                       // 纠错级别
        this.init()
    }

    init () {
        this.code()
        this.addOthercode()                                    // 编码数据函数
    }

    addOthercode () {
        this.codeValue += '0000'                               // 添加结束符
        let flag = this.codeValue.length % 8
        let addZros = 8 - flag
        if (flag) this.codeValue = this.codeValue.padEnd(this.codeValue.length + addZros, '0')
        const codeMath = this.getCodeMath(this.version, this.correctLevel) * 4
        console.log(codeMath)
        if (this.codeValue.length < codeMath) this.codeValue = this.codeValue.padEnd(codeMath, '1110110000010001')
    }

    code () {
        let dataType = (typeof this.data)
        let copyData = this.data
        if (dataType === 'number') {
            let mode = this.getVersionMode(this.version, 'numericMode')
            let numStr = copyData.toString().trim()
            let [numStrGroup, numStrSurplus] = [numStr.length / 3,  numStr.length % 3]
            for (let i = 0; i < numStrGroup; i++) {
                if (i) {
                    this.codeValue = this.codeValue + this.createbits(mode, Number(numStr.substr(i * 3 - 1 , 3)))
                } else {
                    this.codeValue = this.codeValue + this.createbits(mode, Number(numStr.substr(0 , 3)))
                }
            }
            if (numStrSurplus) {
                this.codeValue = this.codeValue + this.createbits(0, Number(numStrSurplus))
            }
            this.codeValue = this.getSign('numeric') + this.createbits(10, numStr.length) + this.codeValue
        } else if (dataType === 'string') {
            let mode = this.getVersionMode(this.version, 'alphanumericMode')
            for (let u = 0, len = copyData.length; u < len; u ++) {
                this.strIndexVlaue.push(this.alphanumericMode(copyData.substr(u, 1)))
            }
            while (this.strIndexVlaue.length > 1) {
                this.codeValue = this.codeValue + this.createbits(11, this.strIndexVlaue.shift() * 45 + this.strIndexVlaue.shift())
            }
            if (this.strIndexVlaue.length) {
                this.codeValue = this.codeValue + this.createbits(6, this.strIndexVlaue.shift())
            }
            this.codeValue = this.getSign('alphanumeric') + this.createbits(mode, this.data.length) + this.codeValue
        } else if (null) {

        } else {

        }
    }
}

console.log(
    new QRcode({
        data: 'CHANDLERGENG'
    })
)