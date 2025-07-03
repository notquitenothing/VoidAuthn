import { SchematicTestRunner } from '@angular-devkit/schematics/testing/index.js'
import * as fs from 'node:fs'
import * as path from 'path'
import appConfig from './config.ts'
import * as sass from 'sass'

export let PRIMARY_COLOR = '#000'
export let PRIMARY_CONTRAST_COLOR = '#FFF'

export async function generateTheme() {
  const schematicRunner = new SchematicTestRunner(
    'schematics',
    './node_modules/@angular/material/schematics/collection.json',
  )

  const options = {
    primaryColor: appConfig.APP_COLOR,
    directory: './',
  }

  try {
    const result = await schematicRunner.runSchematic('m3Theme', options)
    const resultFile = result.files[0]
    if (!resultFile) {
      throw new Error('Generated theme content not found in result.')
    }
    const themeContent = result.readContent(resultFile)
    if (themeContent) {
      fs.mkdirSync('./theme', {
        recursive: true,
      })
      fs.writeFileSync(path.join('./theme', resultFile), themeContent)
    }

    const compiled = await sass.compileAsync(path.join('./theme', 'theme-styles.scss'), {
      loadPaths: [
        './theme',
        './node_modules',
      ],
    })

    // TODO: get primary and contrast color for use in config
    const primary = /--mat-sys-primary: light-dark\((#\w+), (#\w+)\);/.exec(compiled.css)?.[1]
    const contrast = /--mat-sys-on-primary: light-dark\((#\w+), (#\w+)\);/.exec(compiled.css)?.[1]
    if (!primary || !contrast) {
      throw new Error('PRIMARY or CONTRAST color could not be found in theme.')
    }
    PRIMARY_COLOR = primary
    PRIMARY_CONTRAST_COLOR = contrast

    fs.writeFileSync(path.join('./theme', 'generated-mat-theme.css'), compiled.css)
  } catch (error) {
    console.error(error)
  }
}
