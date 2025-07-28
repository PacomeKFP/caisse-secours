Error updating commission config: TypeError: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__.db.transaction(...) is not a function
at CommissionService.updateCommissionConfig (src\lib\services\commissionService.ts:43:6)
at PUT (src\app\api\commissions\config\route.ts:66:28)
41 |           tx.insert(commissionConfig).values(config).run()
42 |         }
> 43 |       })()
|      ^
44 |
45 |       return true
46 |     } catch (error) {
PUT /api/commissions/config error: TypeError: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__.db.transaction(...) is not a function
at CommissionService.updateCommissionConfig (src\lib\services\commissionService.ts:43:6)
at PUT (src\app\api\commissions\config\route.ts:66:28)
41 |           tx.insert(commissionConfig).values(config).run()
42 |         }
> 43 |       })()
|      ^
44 |
45 |       return true
46 |     } catch (error) {
PUT /api/commissions/config 400 in 434ms