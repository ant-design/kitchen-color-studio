import React from 'react'
import { Highlight } from '@ant-design/pro-editor'
import { kebabCase, camelCase } from 'lodash-es'
import { usePrettier, getAlphaColor, colorTypeFormat } from '@/index'
import { CodeView } from '@/styles'
import type { IScales } from '@/ColorStudio/config'

interface ITokenView {
  config: {
    colorType: 'mix' | 'hex' | 'rgb' | 'hsl'
    codeType: 'css' | 'less' | 'scss' | 'js'
    isolateDarkToken: boolean
  }
  data: {
    name: string
    scales: IScales
  }[]
}

const TokenView: React.FC<ITokenView> = ({ data, config }) => {
  const { format } = usePrettier()
  const { colorType, codeType, isolateDarkToken } = config
  const tokenData = data.map((item) => ({
    name: item.name,
    light: item.scales.light.map((s) => colorTypeFormat(s, colorType)),
    lightA: item.scales.light.map((s) => colorTypeFormat(getAlphaColor(s, '#fff'), colorType)),
    dark: item.scales.dark.map((s) => colorTypeFormat(s, colorType)),
    darkA: item.scales.dark.map((s) => colorTypeFormat(getAlphaColor(s, '#000'), colorType)),
  }))

  let content = null

  if (codeType === 'js') {
    if (isolateDarkToken) {
      const objLight = {}
      const objDark = {}
      tokenData.forEach((item) => {
        objLight[camelCase(item.name)] = {
          solid: item.light,
          alpha: item.lightA,
        }
        objDark[camelCase(item.name)] = {
          solid: item.dark,
          alpha: item.darkA,
        }
      })

      content = `
        export interface IScale {
          solid: number[],
          alpha: number[],
        }
  
        export interface ITheme {
          ${Object.keys(objLight)
            .map((key) => `${key}: IScale;`)
            .join('\n')}
        }
  
        export const LightTheme:ITheme = ${JSON.stringify(objLight)}
        
        export const DarkTheme:ITheme = ${JSON.stringify(objDark)}
      `
    } else {
      const obj = {}
      tokenData.forEach((item) => {
        obj[camelCase(item.name)] = {
          light: item.light,
          lightA: item.lightA,
          dark: item.dark,
          darkA: item.darkA,
        }
      })

      content = `
        export interface IScale {
          light: number[],
          lightA: number[],
          dark: number[],
          darkA: number[],
        }
  
        export interface ITheme {
          ${Object.keys(obj)
            .map((key) => `${key}: IScale;`)
            .join('\n')}
        }
  
        export const Theme:ITheme = ${JSON.stringify(obj)}
      `
    }
    content = format(content)
  } else {
    let tokenLightList = isolateDarkToken ? [`/* light.${codeType} */`] : []
    let tokenDarkList = isolateDarkToken ? ['\n', `/* dark.${codeType} */`] : []
    tokenData.forEach((item) => {
      let lightName = kebabCase(item.name)
      let darkName = kebabCase(item.name)
      if (!isolateDarkToken) {
        lightName = 'light-' + lightName
        darkName = 'dark-' + darkName
      }
      let prefix = '--'
      if (codeType === 'less') prefix = '@'
      if (codeType === 'scss') prefix = '$'
      const light = item.light.map((c, index) => `${prefix}${lightName}-color-${index + 1}: ${c};`)
      const lightA = item.lightA.map((c, index) => `${prefix}${lightName}-color-${index + 1}-alpha: ${c};`)
      const dark = item.dark.map((c, index) => `${prefix}${darkName}-color-${index + 1}: ${c};`)
      const darkA = item.darkA.map((c, index) => `${prefix}${darkName}-color-${index + 1}-alpha: ${c};`)
      tokenLightList = [...tokenLightList, ...light, ...lightA]
      tokenDarkList = [...tokenDarkList, ...dark, ...darkA]
    })
    content = [...tokenLightList, ...tokenDarkList].join('\n')
  }
  return (
    <CodeView>
      <Highlight language={codeType} theme="dark">
        {content}
      </Highlight>
    </CodeView>
  )
}

export default React.memo(TokenView)
