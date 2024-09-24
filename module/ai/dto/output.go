package ai_dto

type Provider struct {
	Id           string `json:"id"`
	Name         string `json:"name"`
	Config       string `json:"config"`
	GetAPIKeyUrl string `json:"get_apikey_url"`
}

type ProviderItem struct {
	Id         string `json:"id"`
	Name       string `json:"name"`
	DefaultLLM string `json:"default_llm"`
	Logo       string `json:"logo"`
	//Enable     bool   `json:"enable"`
	Configured bool `json:"configured"`
}

type SimpleProviderItem struct {
	Id         string `json:"id"`
	Name       string `json:"name"`
	Logo       string `json:"logo"`
	Configured bool   `json:"configured"`
}

type LLMItem struct {
	Id     string   `json:"id"`
	Logo   string   `json:"logo"`
	Scopes []string `json:"scopes"`
}
