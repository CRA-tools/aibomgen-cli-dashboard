package middleware

import (
	"time"

	"github.com/gin-gonic/gin"
)

// Logger returns a gin middleware that logs each request using the standard gin
// structured logger extended with request duration.
func Logger() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		raw := c.Request.URL.RawQuery

		c.Next()

		if raw != "" {
			path = path + "?" + raw
		}

		gin.DefaultWriter.Write([]byte(
			time.Now().Format("2006/01/02 - 15:04:05") + " | " +
				formatStatus(c.Writer.Status()) + " | " +
				time.Since(start).String() + " | " +
				c.ClientIP() + " | " +
				c.Request.Method + " " + path + "\n",
		))
	}
}

func formatStatus(code int) string {
	s := ""
	switch {
	case code >= 500:
		s = "5xx"
	case code >= 400:
		s = "4xx"
	case code >= 300:
		s = "3xx"
	default:
		s = "2xx"
	}
	return s + " " + statusText(code)
}

func statusText(code int) string {
	switch code {
	case 200:
		return "200"
	case 201:
		return "201"
	case 204:
		return "204"
	case 400:
		return "400"
	case 404:
		return "404"
	case 422:
		return "422"
	case 500:
		return "500"
	default:
		return "???"
	}
}
