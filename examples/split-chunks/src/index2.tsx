/*
Copyright 2022 ByteDance and/or its affiliates.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import { Card, Calendar } from 'antd'
import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'

function App() {
  const [AsyncButton, setButton] = useState(<div>loading</div>)
  useEffect(() => {
    import('./async-component')
      .then(({ AsyncButton }) => {
        setButton(<AsyncButton />)
      })
      .catch(() => {
        console.error('Error')
      })
  }, [])

  return (
    <div>
      <h1>Size limit fixture</h1>
      <span>Size limit 100kb</span>
      <Card>
        <h1>ant design card</h1>
      </Card>
      {AsyncButton}
      <Calendar />
    </div>
  )
}

createRoot(document.querySelector('#app')!).render(<App />)
