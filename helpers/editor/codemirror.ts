import CodeMirror from "codemirror"

import "codemirror/theme/base16-light.css"
import "codemirror/theme/base16-dark.css"
import "codemirror/theme/3024-night.css"

import "codemirror/lib/codemirror.css"
import "codemirror/addon/lint/lint.css"
import "codemirror/addon/dialog/dialog.css"

import "codemirror/addon/fold/foldgutter.css"
import "codemirror/addon/fold/foldgutter"
import "codemirror/addon/fold/brace-fold"
import "codemirror/addon/fold/comment-fold"
import "codemirror/addon/fold/indent-fold"
import "codemirror/addon/display/autorefresh"
import "codemirror/addon/lint/lint"
import "codemirror/addon/display/placeholder"
import "codemirror/addon/edit/closebrackets"
import "codemirror/addon/search/search"
import "codemirror/addon/search/searchcursor"
import "codemirror/addon/search/jump-to-line"
import "codemirror/addon/dialog/dialog"

import { watch, onMounted, ref, Ref, useContext } from "@nuxtjs/composition-api"
import { LinterDefinition } from "./linting/linter"

type CodeMirrorOptions = {
  extendedEditorConfig: Omit<CodeMirror.EditorConfiguration, "value">
  linter: LinterDefinition | null
}

const DEFAULT_EDITOR_CONFIG: CodeMirror.EditorConfiguration = {
  autoRefresh: true,
  lineNumbers: true,
  foldGutter: true,
  autoCloseBrackets: true,
  gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
}

/**
 * A Vue composable to mount and use Codemirror
 *
 * NOTE: Make sure to import all the necessary Codemirror modules,
 * as this function doesn't import any other than the core
 * @param el Reference to the dom node to attach to
 * @param value Reference to value to read/write to
 * @param options CodeMirror options to pass
 */
export function useCodemirror(
  el: Ref<any | null>,
  value: Ref<string>,
  options: CodeMirrorOptions
) {
  const cm = ref<CodeMirror.Editor | null>(null)

  const updateEditorConfig = () => {
    Object.keys(options.extendedEditorConfig).forEach((key) => {
      // Only update options which need updating
      if (
        cm.value &&
        cm.value?.getOption(key as any) !==
          (options.extendedEditorConfig as any)[key]
      ) {
        cm.value?.setOption(
          key as any,
          (options.extendedEditorConfig as any)[key]
        )
      }
    })
  }

  const updateLinterConfig = () => {
    if (options.linter) {
      cm.value?.setOption("lint", options.linter)
    }
  }

  // Boot-up CodeMirror, set the value and listeners
  onMounted(() => {
    cm.value = CodeMirror(el.value!, DEFAULT_EDITOR_CONFIG)

    setTheme()
    updateEditorConfig()
    updateLinterConfig()

    cm.value.on("change", (instance) => {
      // External update propagation (via watchers) should be ignored
      if (instance.getValue() !== value.value) {
        value.value = instance.getValue()
      }
    })
  })

  const setTheme = () => {
    const { $colorMode } = useContext() as any
    if (cm.value) {
      cm.value?.setOption("theme", getThemeName($colorMode.value))
    }
  }

  const getThemeName = (mode: string) => {
    switch (mode) {
      case "system":
        return "default"
      case "light":
        return "base16-light"
      case "dark":
        return "base16-dark"
      case "black":
        return "3024-night"
      default:
        return "default"
    }
  }

  // If the editor properties are reactive, watch for updates
  watch(() => options.extendedEditorConfig, updateEditorConfig, {
    immediate: true,
    deep: true,
  })
  watch(() => options.linter, updateLinterConfig, { immediate: true })

  // Watch value updates
  watch(value, (newVal) => {
    // Check if we are mounted
    if (cm.value) {
      // Don't do anything on internal updates
      if (cm.value.getValue() !== newVal) {
        cm.value.setValue(newVal)
      }
    }
  })

  return {
    cm,
  }
}