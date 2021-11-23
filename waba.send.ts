
import 'gh+/kodhework/kawix@std0.9.12/std/dist/register.js'

import 'npm://axios@0.21.1'
import axios from 'axios'

import 'npm://mime-types@2.1.29'
import mimeType from 'mime-types'

import fs from '/virtual/@kawix/std/fs/mod'
import Exception from '/virtual/@kawix/std/util/exception'
import Path from 'path'


interface Message{
	chatId?: string,
	number?: string,
	body?: string,
	base64?: string,
	type?: string,
	filename?: string,
	key?: string
}

export class Sender{
	apiUrl = "https://waba.kodhe.work/api/v1/"


	constructor(){

	}


	async main(){

		let params:any = {}, orderedParams = []
		for(let i=1;i<kawix.appArguments.length;i++){
			let arg = kawix.appArguments[i]
			
			if(arg.startsWith("--")){
				let parts = arg.split("=")
				let name = parts[0].substring(2)

				let value = parts[1] || ''
				orderedParams.push({
					name,
					value
				})
				params[name] = value
				params[name+"_Array"] = params[name+"_Array"] || []
				params[name+"_Array"].push(value)
			}
			else{
				params.values = params.value || []
				params.values.push(arg)
			}
		}

        if(params.group){

            console.info(`[LOG] Buscando el grupo ${params.group}`)
            try{
                let response = await axios({
                    method:'POST',
                    url: `${this.apiUrl}whatsapp/chats`,
                    data: {
                        key: 'cdf1e26d3ed5ab309b38dacbed7a74821a0cc5ed',
                        query: {
                            name: params.group,
                            isGroup: true
                        }
                    }
                })
                if(!response.data.length){
                    console.error(`[ERROR] Failed to find group with name: ${params.group}`)
                    return 
                }
                params.chatId = response.data[0].id.uid
            }catch(e){
                if(e.response && e.response.data && e.response.data.error){
                    e = Exception.create(e.response.data.error.message).putCode(e.response.data.error.code)
                }
                throw e
            }

            console.error(`[INFO] Group '${params.group}' has the id: ${params.chatId}`)
            if(!params.text && !params.file) return 

        }

		if(params.key){
			
			if(!params.number && !params.text && !params.file){
				params.values = params.values || []
				params.number = params.values[0]
				params.text_Array = [params.values[1]]
				params.file_Array = [params.values[2]]
			}
			
			if(params.text_Array){
				let text = params.text_Array.join("\n")
				let message:Message = {
					key:params.key,
					body: text,
					number: params.number,
					chatId:params.chatId
				}
				try{
					console.info(`[LOG] Sending message to: ${params.chatId || params.number}`)
					let data = await this.sendMessage(message)
					console.info(`[INFO] Message sent with id: ${data.uid}`)

				}catch(e){
					console.error(`[ERROR] Failed sent: ${e.message}, code: ${e.code || "NONE"}`)
					process.exit(1)
				}

			}
			if(params.file_Array){
				for(let file of params.file_Array){
					let message:Message = {
						key:params.key,
						number: params.number,
						caption: (params.caption_Array || []).join("\n"),
						chatId:params.chatId
					}

					try{
						console.info(`[LOG] Sending message to: ${params.chatId || params.number}`)
						let data = await this.sendMessageFile(message, file)
						console.info(`[INFO] Message sent with id: ${data.uid}`)

					}catch(e){
						console.error(`[ERROR] Failed sent: ${e.message}, code: ${e.code || "NONE"}`)
						process.exit(1)
					}

				}
			}
		}

	}


	async sendMessageFile(message: Message, file: string){
		if(file.startsWith("'") || file.startsWith('"')){
			file = file.substring(1)
		}
		if(file.endsWith("'") || file.endsWith('"')){
			file = file.substring(0,file.length - 1)
		}
		let type = mimeType.lookup(file) || 'application/octect-stream'
		let base64 = await fs.readFileAsync(file, 'base64')
		let dataurl = `data:${type};base64,${base64}`
		message.base64 =dataurl
		message.type = "document"
		message.filename = Path.basename(file)
		return await this.sendMessage(message)
	}

	async sendMessage(message: Message){

		try{
            if(message.chatId) delete message.number 
			let response = await axios({
				method:'POST',
				url: `${this.apiUrl}instances/whatsapp/message.send`,
				data: message
			})
			return response.data
		}catch(e){
			if(e.response && e.response.data && e.response.data.error){
				e = Exception.create(e.response.data.error.message).putCode(e.response.data.error.code)
			}
			throw e
		}
	}

}

(new Sender()).main()
