
{NumberQuestions:true}
-----------
Start with header for global options:

    {NumberQuestions:true}
    -----------

### Multiple Choice Question (Check all that apply)

A *description* for question.  
Questions are created with headers (level 3) `### Multiple Choice Question (Check all that apply)`.

* Choice A
* Choice B
* Choice C

### Single Choice Question

Markdown is great for including questions about code snippets:
```
$(document).ready( function()
{
    ko.applyBindings(new TaskViewModel());
	var converter = new Markdown.Converter();
	document.write(converter.makeHtml("**I am bold**"));
});
```

1. Choice
2. Choice
3. Choice

### Ranking/Rating Table

The first column has the description.  [Use github flavored markdown for table formatting](https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet#wiki-tables).

|                       | Do not Want | Sometimes | Always |
| --------------------- | ----------- | --------- | ------ | 
| Search terms used in IDE	                      |  |  |  |
| Code that did not work out and was deleted.     |  |  |  |
| Time spent on particular edits	              |  |  |  |
| Code and files viewed	                          |  |  |  |
