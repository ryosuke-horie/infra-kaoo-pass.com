# mem-vision-cdk(infrastracture)

## 初回実行
```
npm i
npm run build
cdk bootstrap --profile=mem-vision-dev
```

## デプロイ
```
cdk deploy --all --profile=mem-vision-dev
```

## テスト関連の依存関係
- cdk-nag (セキュリティチェック)
- Vitest (スナップショットテスト)

## CDKの更新時にスナップショットを更新する場合
```
npm run snapshot:update
```
