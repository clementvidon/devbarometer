variable "topic_backend" {
  description = "Declarative backend instance input passed from the root module."

  type = object({
    topic_slug         = string
    topic_name         = string
    environment        = string
    schedule           = string
    sources = list(object({
      kind = string
      url  = string
    }))
    prompt_variant     = string
    database_name      = string
  })
}
