import { io, Socket } from "socket.io-client";
import { TokenService } from "./token.service";

const SOCKET_URL = "http://localhost:8080";

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, (...args: any[]) => void> = new Map();

  async connect(onConnect?: () => void, onError?: (err: any) => void) {
    if (this.socket?.connected) return;

    const token = await TokenService.getToken();

    this.socket = io(SOCKET_URL, {
      path: "/socket",
      transports: ["websocket"],
      auth: {
        token: `Bearer ${token}`,
      },
      reconnection: true,
      reconnectionDelay: 5000,
    });

    this.socket.on("connect", () => {
      console.log("Socket.IO Connected:", this.socket?.id);
      onConnect?.();
    });

    this.socket.on("connect_error", (err: any) => {
      console.error("Socket.IO Connection Error", err);
      onError?.(err);
    });

    this.socket.on("disconnect", (reason: any) => {
      console.log("Socket.IO Disconnected:", reason);
    });
  }

  /**
   * Listen to an event (replacement for STOMP subscribe)
   */
  subscribe(event: string, callback: (payload: any) => void) {
    if (!this.socket) {
      console.warn("Cannot subscribe. Socket not connected.");
      return;
    }

    const handler = (payload: any) => {
      callback(payload);
    };

    this.socket.on(event, handler);
    this.listeners.set(event, handler);
  }

  /**
   * Remove event listener
   */
  unsubscribe(event: string) {
    const handler = this.listeners.get(event);
    if (this.socket && handler) {
      this.socket.off(event, handler);
      this.listeners.delete(event);
    }
  }

  /**
   * Emit event (replacement for STOMP send)
   */
  send(event: string, payload: any) {
    if (!this.socket?.connected) {
      console.warn("Cannot send message. Socket not connected.");
      return;
    }

    this.socket.emit(event, payload);
  }

  disconnect() {
    if (this.socket) {
      this.listeners.forEach((handler, event) => {
        this.socket?.off(event, handler);
      });

      this.listeners.clear();
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export default new SocketService();

// {
//     "success": true,
//     "message": "Success",
//     "data": {
//         "isSuccess": true,
//         "status": "OK",
//         "message": "Success",
//         "data": [
//             {
//                 "id": "388d7b2b-7fce-410d-85ad-d612e65851bc",
//                 "firstName": "FearGod",
//                 "lastName": "Onyenike",
//                 "middleName": "Chukwudi",
//                 "emailAddress": "onyenikechukwudi@gmail.com",
//                 "phoneNumber": "2348160647655",
//                 "password": "$2a$10$czJuOtrdvybibRGs7JU1t.W6u8Fgrz1dfoxjXEDta9nZYwwIo2lAa",
//                 "clientId": "90d9e018-c2a5-461a-b334-71de593d5395",
//                 "investmentAccountId": "203236ef-dded-4ada-8de4-a324d2d98701",
//                 "branchId": "27dc9589-4a04-4690-86d9-393cb456c472",
//                 "usePin": true,
//                 "accountNumber": "0002000026",
//                 "nin": null,
//                 "last_balance": 0.0,
//                 "role": "USER",
//                 "tier": "1",
//                 "gender": "Male ",
//                 "profileImage": null,
//                 "bvn": "22316247222",
//                 "accountNonExpired": true,
//                 "accountNonLocked": true,
//                 "credentialsNonExpired": true,
//                 "authorities": [
//                     {
//                         "authority": "ROLE_USER"
//                     }
//                 ],
//                 "deleted": false,
//                 "disabled": false,
//                 "username": "onyenikechukwudi@gmail.com",
//                 "enabled": true
//             },
//             {
//                 "id": "faca2f05-8d7a-4237-a612-325ff0e658b4",
//                 "firstName": "Chiagoziem",
//                 "lastName": "Okereke",
//                 "middleName": "Emmanuel",
//                 "emailAddress": "okerekechin585@gmail.com",
//                 "phoneNumber": "2347049111574",
//                 "password": "$2a$10$VU14bD4BCR/Cj9TFI0eY4.jgcYzUCgDdd7hDq0aXFCezcl1UctjYG",
//                 "clientId": "f309768b-a889-4b10-b046-0dcff2ba842f",
//                 "investmentAccountId": "3c1ac2a0-6607-4e74-905f-cd6cc8e616a1",
//                 "branchId": "27dc9589-4a04-4690-86d9-393cb456c472",
//                 "usePin": true,
//                 "accountNumber": "0002000072",
//                 "nin": null,
//                 "last_balance": 0.0,
//                 "role": "USER",
//                 "tier": "1",
//                 "gender": "male",
//                 "profileImage": null,
//                 "bvn": "22787656357",
//                 "accountNonExpired": true,
//                 "accountNonLocked": true,
//                 "credentialsNonExpired": true,
//                 "authorities": [
//                     {
//                         "authority": "ROLE_USER"
//                     }
//                 ],
//                 "deleted": false,
//                 "disabled": false,
//                 "username": "okerekechin585@gmail.com",
//                 "enabled": true
//             },
//             {
//                 "id": "dfed6af8-5d9b-4189-b3eb-0acc7a03d416",
//                 "firstName": "Ebubechukwu",
//                 "lastName": "CHUKWU",
//                 "middleName": "ESTHER",
//                 "emailAddress": "ebubeesther2019@gmail.com",
//                 "phoneNumber": "2347016185207",
//                 "password": "$2a$10$5P76YZuNeDHUmecAx1/ZIeiF6UwKVWdNTsCXdHHy8CjfiOJYpu7I2",
//                 "clientId": "83426ef1-4fc7-4846-b9ee-99d1768f3642",
//                 "investmentAccountId": "a8ccf709-c0f2-4402-b653-7dc38543e084",
//                 "branchId": "27dc9589-4a04-4690-86d9-393cb456c472",
//                 "usePin": true,
//                 "accountNumber": "0002000075",
//                 "nin": null,
//                 "last_balance": 100.0,
//                 "role": "USER",
//                 "tier": "2",
//                 "gender": "MALE",
//                 "profileImage": null,
//                 "bvn": "22570178408",
//                 "accountNonExpired": true,
//                 "accountNonLocked": true,
//                 "credentialsNonExpired": true,
//                 "authorities": [
//                     {
//                         "authority": "ROLE_USER"
//                     }
//                 ],
//                 "deleted": false,
//                 "disabled": false,
//                 "username": "ebubeesther2019@gmail.com",
//                 "enabled": true
//             },
//             {
//                 "id": "08434eac-e737-49ea-9569-fc256223c1da",
//                 "firstName": "ADEBIMPE",
//                 "lastName": "ADELEYE",
//                 "middleName": "ADEBIMPE",
//                 "emailAddress": "bimpeadewole@gmail.com",
//                 "phoneNumber": "2348141342890",
//                 "password": "$2a$10$5.KcKcBsU52Ne4BW7CbV0ulAaaL5tCShfwERoRdYDdzEMJyBRqZ7y",
//                 "clientId": "0371e0cf-80b5-42e0-97cb-a13917a6d086",
//                 "investmentAccountId": "e6601536-6d5e-4e5f-bc8c-fd9cc3067626",
//                 "branchId": "27dc9589-4a04-4690-86d9-393cb456c472",
//                 "usePin": false,
//                 "accountNumber": null,
//                 "nin": "",
//                 "last_balance": 0.0,
//                 "role": "USER",
//                 "tier": "2",
//                 "gender": "FEMALE",
//                 "profileImage": null,
//                 "bvn": "",
//                 "accountNonExpired": true,
//                 "accountNonLocked": true,
//                 "credentialsNonExpired": true,
//                 "authorities": [
//                     {
//                         "authority": "ROLE_USER"
//                     }
//                 ],
//                 "deleted": false,
//                 "disabled": false,
//                 "username": "bimpeadewole@gmail.com",
//                 "enabled": true
//             },
//             {
//                 "id": "4f3b7250-d2a2-4be5-9991-311ac4c9238a",
//                 "firstName": "Maina",
//                 "lastName": "Wadai",
//                 "middleName": "Yahaya",
//                 "emailAddress": "Mainaw39@gmail.com",
//                 "phoneNumber": "2347062220232",
//                 "password": "$2a$10$DmoyQuGlyApW2uqhmiufruc8YNRKzS3uVGJGboVFsto8ojwpgrxe6",
//                 "clientId": "a5e07661-5854-4860-8fbb-7ff442df187a",
//                 "investmentAccountId": "d4fa2673-e885-416c-a376-e57e0e701957",
//                 "branchId": "27dc9589-4a04-4690-86d9-393cb456c472",
//                 "usePin": true,
//                 "accountNumber": "0002000073",
//                 "nin": null,
//                 "last_balance": 0.0,
//                 "role": "USER",
//                 "tier": "1",
//                 "gender": "male",
//                 "profileImage": null,
//                 "bvn": "22152362553",
//                 "accountNonExpired": true,
//                 "accountNonLocked": true,
//                 "credentialsNonExpired": true,
//                 "authorities": [
//                     {
//                         "authority": "ROLE_USER"
//                     }
//                 ],
//                 "deleted": false,
//                 "disabled": false,
//                 "username": "Mainaw39@gmail.com",
//                 "enabled": true
//             },
//             {
//                 "id": "b5a0d00b-d853-47a9-91c1-dd12494f8f02",
//                 "firstName": "Olumuyiwa",
//                 "lastName": "Biala",
//                 "middleName": "Jokotola",
//                 "emailAddress": "oluwaves@yahoo.com",
//                 "phoneNumber": "447740564766",
//                 "password": "$2a$10$7xi3qtBfaU7RZtRsIVsu9.n6dpeKCPHbBpAsKs9wRWO7xDT0GObUi",
//                 "clientId": "3727b84f-4cc5-475e-82ec-95d9b6d087c5",
//                 "investmentAccountId": "6d3eff32-a464-47b5-942b-de6fc3f9721b",
//                 "branchId": "27dc9589-4a04-4690-86d9-393cb456c472",
//                 "usePin": false,
//                 "accountNumber": "0002000048",
//                 "nin": null,
//                 "last_balance": 0.0,
//                 "role": "USER",
//                 "tier": "1",
//                 "gender": "Male",
//                 "profileImage": null,
//                 "bvn": "22147534390",
//                 "accountNonExpired": true,
//                 "accountNonLocked": true,
//                 "credentialsNonExpired": true,
//                 "authorities": [
//                     {
//                         "authority": "ROLE_USER"
//                     }
//                 ],
//                 "deleted": false,
//                 "disabled": false,
//                 "username": "oluwaves@yahoo.com",
//                 "enabled": true
//             },
//             {
//                 "id": "c7d88e88-e2d3-4026-8d28-a9d827b13f5d",
//                 "firstName": "Bamgbola",
//                 "lastName": "Daudu",
//                 "middleName": "Modupe",
//                 "emailAddress": "bamgbola.daudu@gmail.com",
//                 "phoneNumber": "8032369880",
//                 "password": "$2a$10$VsRzj8bDtYAVLozrEmp/I.rgjdDQs9bV6dLHncPs2bJ11EzWtCt3C",
//                 "clientId": "7e709879-8ba4-4672-a77e-4d3f73d0eb85",
//                 "investmentAccountId": "255d48a3-cb5f-4cda-9549-be9c69a701a0",
//                 "branchId": "27dc9589-4a04-4690-86d9-393cb456c472",
//                 "usePin": false,
//                 "accountNumber": null,
//                 "nin": "",
//                 "last_balance": 0.0,
//                 "role": "USER",
//                 "tier": "2",
//                 "gender": "MALE",
//                 "profileImage": null,
//                 "bvn": "",
//                 "accountNonExpired": true,
//                 "accountNonLocked": true,
//                 "credentialsNonExpired": true,
//                 "authorities": [
//                     {
//                         "authority": "ROLE_USER"
//                     }
//                 ],
//                 "deleted": false,
//                 "disabled": false,
//                 "username": "bamgbola.daudu@gmail.com",
//                 "enabled": true
//             },
//             {
//                 "id": "c9dd409d-aa2b-4ee4-b444-2ebbd9811439",
//                 "firstName": "MAYOWA",
//                 "lastName": "OLAIFA",
//                 "middleName": null,
//                 "emailAddress": "mayowaolaifa38@gmail.com",
//                 "phoneNumber": "08127520812",
//                 "password": "$2a$10$wU9d.eAGn8riEgYdAug23.LbC2ucb9mclf2DVhtrlqON5pJJOBpH.",
//                 "clientId": "71c626b8-4114-46be-b6be-2bad1154473f",
//                 "investmentAccountId": "44222b0a-883d-43d0-a719-c29687b58216",
//                 "branchId": "27dc9589-4a04-4690-86d9-393cb456c472",
//                 "usePin": true,
//                 "accountNumber": "0002000074",
//                 "nin": null,
//                 "last_balance": 1000.0,
//                 "role": "USER",
//                 "tier": "2",
//                 "gender": "MALE",
//                 "profileImage": null,
//                 "bvn": "22343628055",
//                 "accountNonExpired": true,
//                 "accountNonLocked": true,
//                 "credentialsNonExpired": true,
//                 "authorities": [
//                     {
//                         "authority": "ROLE_USER"
//                     }
//                 ],
//                 "deleted": false,
//                 "disabled": false,
//                 "username": "mayowaolaifa38@gmail.com",
//                 "enabled": true
//             },
//             {
//                 "id": "0ee3a973-9115-4abd-a1c7-a56e9d37a698",
//                 "firstName": "Praise",
//                 "lastName": "Adeleye",
//                 "middleName": "TOBI",
//                 "emailAddress": "adeleyepraisetobi@gmail.com",
//                 "phoneNumber": "09128774802",
//                 "password": "$2a$10$omq8nQNDUnpaz.iMP3HyL.TLpeW0LmBmeylqwfa/5qiV18knAvJPi",
//                 "clientId": "0371e0cf-80b5-42e0-97cb-a13917a6d086",
//                 "investmentAccountId": "e6601536-6d5e-4e5f-bc8c-fd9cc3067626",
//                 "branchId": "27dc9589-4a04-4690-86d9-393cb456c472",
//                 "usePin": true,
//                 "accountNumber": "0002000047",
//                 "nin": "",
//                 "last_balance": 0.0,
//                 "role": "USER",
//                 "tier": "2",
//                 "gender": "MALE",
//                 "profileImage": null,
//                 "bvn": "22213172752",
//                 "accountNonExpired": true,
//                 "accountNonLocked": true,
//                 "credentialsNonExpired": true,
//                 "authorities": [
//                     {
//                         "authority": "ROLE_USER"
//                     }
//                 ],
//                 "deleted": false,
//                 "disabled": false,
//                 "username": "adeleyepraisetobi@gmail.com",
//                 "enabled": true
//             },
//             {
//                 "id": "7d8f8234-861e-4391-83f2-5d44b6b9341a",
//                 "firstName": "ANTHONY",
//                 "lastName": "OJO",
//                 "middleName": "OLUSOLA",
//                 "emailAddress": "tonylibraonline79@gmail.com",
//                 "phoneNumber": "08020761323",
//                 "password": "$2a$10$SrdyNAMNuLrFBfzT9bFMieHp2JBVj90JrYLwmZQ96cMDQzMiBMp9i",
//                 "clientId": "9b862286-16c7-429f-b36c-5cf73f0ca5bc",
//                 "investmentAccountId": "fb0b7b95-3041-479a-9cea-4d19161d6aac",
//                 "branchId": "27dc9589-4a04-4690-86d9-393cb456c472",
//                 "usePin": true,
//                 "accountNumber": "0002000077",
//                 "nin": null,
//                 "last_balance": 0.0,
//                 "role": "USER",
//                 "tier": "2",
//                 "gender": "MALE",
//                 "profileImage": null,
//                 "bvn": "22143950066",
//                 "accountNonExpired": true,
//                 "accountNonLocked": true,
//                 "credentialsNonExpired": true,
//                 "authorities": [
//                     {
//                         "authority": "ROLE_USER"
//                     }
//                 ],
//                 "deleted": false,
//                 "disabled": false,
//                 "username": "tonylibraonline79@gmail.com",
//                 "enabled": true
//             },
//             {
//                 "id": "0548cb7b-d0c6-4ad8-abeb-e0b432f0897f",
//                 "firstName": "Patrick",
//                 "lastName": "Elabor",
//                 "middleName": "IDAHOTA",
//                 "emailAddress": "elaborpatrick.e@gmail.com",
//                 "phoneNumber": "2348102515484",
//                 "password": "$2a$10$oFR6pkDYaOeKIEIspvZnHeyvnlobdnQ3vqDTcoZJ5.M73px8IKhsG",
//                 "clientId": "3483e877-1d7f-487a-903e-0413d100415e",
//                 "investmentAccountId": "1df54276-9982-4ca6-ac99-fa5f9b91b8bd",
//                 "branchId": "27dc9589-4a04-4690-86d9-393cb456c472",
//                 "usePin": true,
//                 "accountNumber": "0002000044",
//                 "nin": null,
//                 "last_balance": 0.0,
//                 "role": "USER",
//                 "tier": "1",
//                 "gender": "Male",
//                 "profileImage": null,
//                 "bvn": "22189707965",
//                 "accountNonExpired": true,
//                 "accountNonLocked": true,
//                 "credentialsNonExpired": true,
//                 "authorities": [
//                     {
//                         "authority": "ROLE_USER"
//                     }
//                 ],
//                 "deleted": false,
//                 "disabled": false,
//                 "username": "elaborpatrick.e@gmail.com",
//                 "enabled": true
//             },
//             {
//                 "id": "7b364a45-3bf6-495c-af14-c3f92e323330",
//                 "firstName": "David",
//                 "lastName": "Areegbe",
//                 "middleName": "Oluwaseun",
//                 "emailAddress": "areegbedavid@gmail.com",
//                 "phoneNumber": "2349015061171",
//                 "password": "$2a$10$6F96V0aaF0Di5/YPxHV5yejFEab26ZY50ySTwMcKThdrd88F8qqBa",
//                 "clientId": "4f92dcd5-5c7c-4461-894e-a1297c29b060",
//                 "investmentAccountId": "11a1b212-1c4e-4eb2-aa4b-d657aad799d8",
//                 "branchId": "27dc9589-4a04-4690-86d9-393cb456c472",
//                 "usePin": true,
//                 "accountNumber": "0002000071",
//                 "nin": null,
//                 "last_balance": 0.0,
//                 "role": "USER",
//                 "tier": "1",
//                 "gender": "male",
//                 "profileImage": null,
//                 "bvn": "22696258217",
//                 "accountNonExpired": true,
//                 "accountNonLocked": true,
//                 "credentialsNonExpired": true,
//                 "authorities": [
//                     {
//                         "authority": "ROLE_USER"
//                     }
//                 ],
//                 "deleted": false,
//                 "disabled": false,
//                 "username": "areegbedavid@gmail.com",
//                 "enabled": true
//             },
//             {
//                 "id": "82e68613-22bd-4418-831a-29c4a34a2652",
//                 "firstName": "Peter",
//                 "lastName": "Abah",
//                 "middleName": "Uchechukwu",
//                 "emailAddress": "uchechukwupeter22@gmail.com",
//                 "phoneNumber": "2348051346872",
//                 "password": "$2a$10$Ebx6jhInlgx9vtlk5qkjm.uxMBwLs3tRFGScXSJBgMUadPRURKriK",
//                 "clientId": "493024b2-edec-4043-9019-2d53b07fd642",
//                 "investmentAccountId": "9cf645ba-2477-4b2e-963a-d59b98ab9ed3",
//                 "branchId": "27dc9589-4a04-4690-86d9-393cb456c472",
//                 "usePin": true,
//                 "accountNumber": "0002000070",
//                 "nin": null,
//                 "last_balance": 0.0,
//                 "role": "USER",
//                 "tier": "1",
//                 "gender": "male",
//                 "profileImage": null,
//                 "bvn": "22654262061",
//                 "accountNonExpired": true,
//                 "accountNonLocked": true,
//                 "credentialsNonExpired": true,
//                 "authorities": [
//                     {
//                         "authority": "ROLE_USER"
//                     }
//                 ],
//                 "deleted": false,
//                 "disabled": false,
//                 "username": "uchechukwupeter22@gmail.com",
//                 "enabled": true
//             },
//             {
//                 "id": "b2afa034-daa4-4f87-aea2-342cf1a6f44d",
//                 "firstName": "Omotosho",
//                 "lastName": "Oni",
//                 "middleName": "oyeyemi",
//                 "emailAddress": "omotoshogold1@gmail.com",
//                 "phoneNumber": "8063026615",
//                 "password": "$2a$10$9tW6BJYkmRWXbf1hvIeYWekVCeC.IY5nvFIcFGjpDRjO2rybpYXSu",
//                 "clientId": "0e7a7c87-26ed-4023-9220-cf4a52d70fdb",
//                 "investmentAccountId": "419339bf-cc69-4245-905d-8bddf1c0f1a4",
//                 "branchId": "27dc9589-4a04-4690-86d9-393cb456c472",
//                 "usePin": true,
//                 "accountNumber": "0002000076",
//                 "nin": null,
//                 "last_balance": 0.0,
//                 "role": "USER",
//                 "tier": "2",
//                 "gender": "MALE",
//                 "profileImage": null,
//                 "bvn": "22144080173",
//                 "accountNonExpired": true,
//                 "accountNonLocked": true,
//                 "credentialsNonExpired": true,
//                 "authorities": [
//                     {
//                         "authority": "ROLE_USER"
//                     }
//                 ],
//                 "deleted": false,
//                 "disabled": false,
//                 "username": "omotoshogold1@gmail.com",
//                 "enabled": true
//             }
//         ]
//     },
//     "timestamp": "2026-01-24T14:22:46.207358053"
// }
