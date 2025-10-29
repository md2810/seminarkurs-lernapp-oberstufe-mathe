import { onRequestGet as __api_analyze_image_js_onRequestGet } from "C:\\Users\\marco\\dev\\Seminarkurs\\seminarkurs-lernapp-oberstufe-mathe\\functions\\api\\analyze-image.js"
import { onRequestPost as __api_analyze_image_js_onRequestPost } from "C:\\Users\\marco\\dev\\Seminarkurs\\seminarkurs-lernapp-oberstufe-mathe\\functions\\api\\analyze-image.js"
import { onRequestGet as __api_auth_js_onRequestGet } from "C:\\Users\\marco\\dev\\Seminarkurs\\seminarkurs-lernapp-oberstufe-mathe\\functions\\api\\auth.js"
import { onRequestPost as __api_auth_js_onRequestPost } from "C:\\Users\\marco\\dev\\Seminarkurs\\seminarkurs-lernapp-oberstufe-mathe\\functions\\api\\auth.js"
import { onRequestGet as __api_evaluate_answer_js_onRequestGet } from "C:\\Users\\marco\\dev\\Seminarkurs\\seminarkurs-lernapp-oberstufe-mathe\\functions\\api\\evaluate-answer.js"
import { onRequestPost as __api_evaluate_answer_js_onRequestPost } from "C:\\Users\\marco\\dev\\Seminarkurs\\seminarkurs-lernapp-oberstufe-mathe\\functions\\api\\evaluate-answer.js"
import { onRequestGet as __api_generate_custom_hint_js_onRequestGet } from "C:\\Users\\marco\\dev\\Seminarkurs\\seminarkurs-lernapp-oberstufe-mathe\\functions\\api\\generate-custom-hint.js"
import { onRequestPost as __api_generate_custom_hint_js_onRequestPost } from "C:\\Users\\marco\\dev\\Seminarkurs\\seminarkurs-lernapp-oberstufe-mathe\\functions\\api\\generate-custom-hint.js"
import { onRequestGet as __api_generate_questions_js_onRequestGet } from "C:\\Users\\marco\\dev\\Seminarkurs\\seminarkurs-lernapp-oberstufe-mathe\\functions\\api\\generate-questions.js"
import { onRequestPost as __api_generate_questions_js_onRequestPost } from "C:\\Users\\marco\\dev\\Seminarkurs\\seminarkurs-lernapp-oberstufe-mathe\\functions\\api\\generate-questions.js"
import { onRequestGet as __api_get_models_js_onRequestGet } from "C:\\Users\\marco\\dev\\Seminarkurs\\seminarkurs-lernapp-oberstufe-mathe\\functions\\api\\get-models.js"
import { onRequestPost as __api_get_models_js_onRequestPost } from "C:\\Users\\marco\\dev\\Seminarkurs\\seminarkurs-lernapp-oberstufe-mathe\\functions\\api\\get-models.js"
import { onRequestGet as __api_update_auto_mode_js_onRequestGet } from "C:\\Users\\marco\\dev\\Seminarkurs\\seminarkurs-lernapp-oberstufe-mathe\\functions\\api\\update-auto-mode.js"
import { onRequestPost as __api_update_auto_mode_js_onRequestPost } from "C:\\Users\\marco\\dev\\Seminarkurs\\seminarkurs-lernapp-oberstufe-mathe\\functions\\api\\update-auto-mode.js"

export const routes = [
    {
      routePath: "/api/analyze-image",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_analyze_image_js_onRequestGet],
    },
  {
      routePath: "/api/analyze-image",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_analyze_image_js_onRequestPost],
    },
  {
      routePath: "/api/auth",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_auth_js_onRequestGet],
    },
  {
      routePath: "/api/auth",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_auth_js_onRequestPost],
    },
  {
      routePath: "/api/evaluate-answer",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_evaluate_answer_js_onRequestGet],
    },
  {
      routePath: "/api/evaluate-answer",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_evaluate_answer_js_onRequestPost],
    },
  {
      routePath: "/api/generate-custom-hint",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_generate_custom_hint_js_onRequestGet],
    },
  {
      routePath: "/api/generate-custom-hint",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_generate_custom_hint_js_onRequestPost],
    },
  {
      routePath: "/api/generate-questions",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_generate_questions_js_onRequestGet],
    },
  {
      routePath: "/api/generate-questions",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_generate_questions_js_onRequestPost],
    },
  {
      routePath: "/api/get-models",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_get_models_js_onRequestGet],
    },
  {
      routePath: "/api/get-models",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_get_models_js_onRequestPost],
    },
  {
      routePath: "/api/update-auto-mode",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_update_auto_mode_js_onRequestGet],
    },
  {
      routePath: "/api/update-auto-mode",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_update_auto_mode_js_onRequestPost],
    },
  ]